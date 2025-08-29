const { Boom } = require('@hapi/boom')
const NodeCache = require('node-cache')
const readline = require('readline')
const { makeWASocket, AnyMessageContent, BinaryInfo, delay, DisconnectReason, downloadAndProcessHistorySyncNotification, encodeWAM, fetchLatestBaileysVersion, getAggregateVotesInPollMessage, getHistoryMsg, isJidNewsletter, jidDecode, makeCacheableSignalKeyStore, normalizeMessageContent, PatchedMessageWithRecipientJID, proto, useMultiFileAuthState, WAMessageContent, WAMessageKey } = require('@whiskeysockets/baileys')
//const MAIN_LOGGER = require('../src/Utils/logger')
const open = require('open')
const fs = require('fs')
const P = require('pino')
const express = require('express')
const http = require('http')
const { body, validationResult } = require('express-validator')
const moment = require('moment-timezone')
const fileUpload = require('express-fileupload')
const qrcode = require('qrcode-terminal')
const { GoogleGenerativeAI } = require('@google/generative-ai')

// Load configuration
let config
try {
	config = JSON.parse(fs.readFileSync('./config/config.json', 'utf8'))
} catch (error) {
	console.error('❌ Config file not found or invalid. Please copy config/config.json.example to config/config.json and configure it.')
	process.exit(1)
}

const logger = P({
	timestamp: () => `,"time":"${moment().tz(config.timezone || 'UTC').format()}"`
}, P.destination(`./${config.logFileName}`))
logger.level = config.levelLog

// Initialize Google AI
let genAI = null
let chatModel = null

// Conversation memory storage
const conversationMemory = new Map()
const conversationSessions = new Map()
const conversationModeTimers = new Map() // Store timeout timers for conversation mode
const conversationModeActive = new Map() // Track active conversation modes

// Conversation management configuration
const CONVERSATION_CONFIG = {
	maxHistoryLength: config.googleAI?.maxHistoryLength || 20, // Maximum messages to keep in context
	contextWindowTokens: config.googleAI?.contextWindowTokens || 8000, // Estimated token limit for context
	conversationTimeout: config.googleAI?.conversationTimeout || 30 * 60 * 1000, // 30 minutes in ms
	conversationModeTimeout: config.googleAI?.conversationModeTimeout || 5 * 60 * 1000, // 5 minutes in ms
	maxTokensPerMessage: 500, // Rough estimate of tokens per message
	inactivityWarningDelay: 1000, // Delay before sending inactivity warning (1 second)
}

if (config.features.chatbot && config.googleAI && config.googleAI.apiKey && config.googleAI.apiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
	try {
		// Validate and fix model name if needed
		let modelName = config.googleAI.model || 'gemini-1.5-flash'
		
		// Fix common model name issues
		if (modelName === 'gemini-2.5-flash') {
			modelName = 'gemini-2.0-flash-exp'
			console.log('🔧 Fixed invalid model name: gemini-2.5-flash -> gemini-2.0-flash-exp')
		}
		
		genAI = new GoogleGenerativeAI(config.googleAI.apiKey)
		chatModel = genAI.getGenerativeModel({
			model: modelName,
			generationConfig: {
				maxOutputTokens: config.googleAI.maxTokens || 4000,
				temperature: config.googleAI.temperature || 0.7
			}
		})
		console.log(`✅ Google AI chatbot initialized successfully with model: ${modelName}`)
		console.log(`📊 Max tokens: ${config.googleAI.maxTokens || 4000}`)
	} catch (error) {
		console.error('❌ Failed to initialize Google AI:', error.message)
		chatModel = null
	}
} else {
	console.log('⚠️ Google AI chatbot disabled or API key not configured')
}

// Conversation memory management functions
function getConversationKey(userJid) {
	// Create a unique key for each conversation
	return userJid.replace('@s.whatsapp.net', '').replace('@g.us', '_group')
}

function initializeConversation(userJid) {
	const key = getConversationKey(userJid)
	if (!conversationMemory.has(key)) {
		conversationMemory.set(key, {
			messages: [],
			createdAt: Date.now(),
			lastActivity: Date.now(),
			messageCount: 0,
			userInfo: {
				jid: userJid,
				isGroup: userJid.includes('@g.us')
			},
			conversationMode: false,
			modeActivatedAt: null
		})
		console.log(`🧠 New conversation initialized for ${userJid}`)
	}
	return conversationMemory.get(key)
}

// Conversation mode management
function activateConversationMode(userJid) {
	const key = getConversationKey(userJid)
	const conversation = initializeConversation(userJid)

	// Clear any existing timer
	if (conversationModeTimers.has(key)) {
		clearTimeout(conversationModeTimers.get(key))
	}

	// Activate conversation mode
	conversation.conversationMode = true
	conversation.modeActivatedAt = Date.now()
	conversationModeActive.set(key, true)

	console.log(`🎯 Conversation mode ACTIVATED for ${userJid} (will timeout 5 min after my last response)`)
	return true
}

function deactivateConversationMode(userJid, sendNotification = false) {
	const key = getConversationKey(userJid)
	const conversation = conversationMemory.get(key)

	if (conversation) {
		conversation.conversationMode = false
		conversation.modeActivatedAt = null
	}

	conversationModeActive.set(key, false)

	// Clear timer
	if (conversationModeTimers.has(key)) {
		clearTimeout(conversationModeTimers.get(key))
		conversationModeTimers.delete(key)
	}

	console.log(`⏸️ Conversation mode DEACTIVATED for ${userJid}`)

	// Send notification to user after a short delay
	if (sendNotification && globalSock) {
		setTimeout(async () => {
			try {
				const notificationMessage = `💤 *Mode Percakapan Berakhir*

Aku sudah mematikan mode percakapan karena 5 menit tidak ada aktivitas sejak respons terakhirku.

✅ Riwayat percakapan kita tersimpan
✅ Aku masih di sini untuk bantu pertanyaan baru
✅ Gunakan */ai* atau */chat* untuk mulai mode percakapan lagi

Silakan kirim pesan kapan saja! 😊`

				await globalSock.sendMessage(userJid, { text: notificationMessage })
				console.log(`📨 Notifikasi nonaktivasi mode percakapan dikirim ke ${userJid}`)
			} catch (error) {
				console.error(`❌ Failed to send deactivation notification to ${userJid}:`, error.message)
			}
		}, CONVERSATION_CONFIG.inactivityWarningDelay)
	}

	return true
}

function isConversationModeActive(userJid) {
	const key = getConversationKey(userJid)
	return conversationModeActive.get(key) || false
}

function startConversationModeTimer(userJid) {
	const key = getConversationKey(userJid)

	// Only start timer if conversation mode is currently active
	if (isConversationModeActive(userJid)) {
		// Clear existing timer
		if (conversationModeTimers.has(key)) {
			clearTimeout(conversationModeTimers.get(key))
		}

		// Set timer from AI's response (5 minutes of user inactivity)
		const timer = setTimeout(() => {
			deactivateConversationMode(userJid, true) // true = send notification
		}, CONVERSATION_CONFIG.conversationModeTimeout)

		conversationModeTimers.set(key, timer)

		console.log(`⏰ Conversation mode timer STARTED - will deactivate in 5 min if no user response to ${userJid}`)
	}
}

function addMessageToConversation(userJid, message, role = 'user') {
	const conversation = initializeConversation(userJid)
	const messageObj = {
		role: role,
		content: message,
		timestamp: Date.now(),
		id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
	}

	conversation.messages.push(messageObj)
	conversation.lastActivity = Date.now()
	conversation.messageCount++

	// If user sends a message and conversation mode is active, cancel the timer
	// Timer will restart when AI responds
	if (role === 'user' && isConversationModeActive(userJid)) {
		const key = getConversationKey(userJid)
		if (conversationModeTimers.has(key)) {
			clearTimeout(conversationModeTimers.get(key))
			conversationModeTimers.delete(key)
			console.log(`⏰ Timer CLEARED - user responded to ${userJid}`)
		}
	}

	// Manage conversation length and context window
	manageConversationLength(userJid)

	return messageObj
}

function manageConversationLength(userJid) {
	const conversation = conversationMemory.get(getConversationKey(userJid))
	if (!conversation) return

	// Remove old messages if conversation is too long
	if (conversation.messages.length > CONVERSATION_CONFIG.maxHistoryLength) {
		const messagesToRemove = conversation.messages.length - CONVERSATION_CONFIG.maxHistoryLength
		conversation.messages.splice(0, messagesToRemove)
		console.log(`🧹 Trimmed ${messagesToRemove} old messages from conversation with ${userJid}`)
	}

	// Estimate token usage and trim if necessary
	const estimatedTokens = conversation.messages.length * CONVERSATION_CONFIG.maxTokensPerMessage
	if (estimatedTokens > CONVERSATION_CONFIG.contextWindowTokens) {
		const messagesToKeep = Math.floor(CONVERSATION_CONFIG.contextWindowTokens / CONVERSATION_CONFIG.maxTokensPerMessage)
		const messagesToRemove = conversation.messages.length - messagesToKeep
		if (messagesToRemove > 0) {
			conversation.messages.splice(0, messagesToRemove)
			console.log(`🧹 Trimmed ${messagesToRemove} messages due to token limit for ${userJid}`)
		}
	}
}

function getConversationContext(userJid) {
	const conversation = conversationMemory.get(getConversationKey(userJid))
	if (!conversation || conversation.messages.length === 0) {
		return []
	}

	// Check if conversation has expired
	const timeSinceLastActivity = Date.now() - conversation.lastActivity
	if (timeSinceLastActivity > CONVERSATION_CONFIG.conversationTimeout) {
		console.log(`⏰ Conversation with ${userJid} has expired, starting fresh`)
		clearConversation(userJid)
		return []
	}

	return conversation.messages
}

function clearConversation(userJid) {
	const key = getConversationKey(userJid)

	// Clear conversation mode timer and deactivate mode
	if (conversationModeTimers.has(key)) {
		clearTimeout(conversationModeTimers.get(key))
		conversationModeTimers.delete(key)
	}
	conversationModeActive.set(key, false)

	// Clear conversation memory
	conversationMemory.delete(key)
	console.log(`🗑️ Conversation and mode cleared for ${userJid}`)
}

function getConversationStats(userJid) {
	const conversation = conversationMemory.get(getConversationKey(userJid))
	if (!conversation) return null

	const isActive = isConversationModeActive(userJid)
	const timeRemaining = isActive && conversation.modeActivatedAt ?
		Math.max(0, CONVERSATION_CONFIG.conversationModeTimeout - (Date.now() - conversation.lastActivity)) : 0

	return {
		messageCount: conversation.messageCount,
		messagesInContext: conversation.messages.length,
		createdAt: new Date(conversation.createdAt).toISOString(),
		lastActivity: new Date(conversation.lastActivity).toISOString(),
		isGroup: conversation.userInfo.isGroup,
		conversationMode: {
			active: isActive,
			activatedAt: conversation.modeActivatedAt ? new Date(conversation.modeActivatedAt).toISOString() : null,
			timeoutMinutes: CONVERSATION_CONFIG.conversationModeTimeout / 60000,
			timeRemainingMs: timeRemaining
		}
	}
}

// Cleanup expired conversations
function cleanupExpiredConversations() {
	const now = Date.now()
	const expiredKeys = []

	for (const [key, conversation] of conversationMemory.entries()) {
		const timeSinceLastActivity = now - conversation.lastActivity
		if (timeSinceLastActivity > CONVERSATION_CONFIG.conversationTimeout) {
			expiredKeys.push(key)
		}
	}

	for (const key of expiredKeys) {
		// Clear conversation mode timer if exists
		if (conversationModeTimers.has(key)) {
			clearTimeout(conversationModeTimers.get(key))
			conversationModeTimers.delete(key)
		}
		conversationModeActive.delete(key)
		conversationMemory.delete(key)
		console.log(`🧹 Cleaned up expired conversation: ${key}`)
	}

	if (expiredKeys.length > 0) {
		console.log(`🧹 Cleaned up ${expiredKeys.length} expired conversations`)
	}
}

// Run cleanup every 30 minutes
setInterval(cleanupExpiredConversations, 30 * 60 * 1000)

const doReplies = process.argv.includes('--do-reply') || config.features.autoReply

// AI Chatbot function with WhatsApp formatting and Indonesian language support
async function getAIResponse(messageText, userJid, userName = null) {
	if (!chatModel) {
		return null
	}

	try {
		// Add user message to conversation
		addMessageToConversation(userJid, messageText, 'user')

		// Get conversation context - only use full context if conversation mode is active
		const conversationHistory = getConversationContext(userJid)
		const isModeActive = isConversationModeActive(userJid)
		const isGroup = userJid.includes('@g.us')

		// Enhanced system prompt with WhatsApp formatting instructions
		const whatsappFormattingInstructions = `
Gunakan format WhatsApp:
- *bold* untuk penting
- _italic_ untuk catatan
- • untuk bullet points
- 1. 2. 3. untuk numbered lists
- Emoji yang sesuai
- Paragraf pendek untuk mobile
- Respons dalam bahasa Indonesia

PENTING: Berikan respons yang LENGKAP dan SELESAI. Jangan berhenti di tengah kalimat. Pastikan jawaban berakhir dengan tanda baca yang sesuai (.!?).`

		// Build user context for group messages
		let userContext = ''
		if (isGroup && userName) {
			userContext = `\n\nUser yang bertanya: ${userName}${userName ? ` - tolong selalu sebut nama ${userName} ketika merespon.` : ''}`
		}

		// Build conversation context for AI
		let result

		if (isModeActive && conversationHistory.length > 1) {
			// Conversation mode is active - use full context with enhanced formatting

			// Filter history to ensure it starts with a user message
			let filteredHistory = conversationHistory.slice(0, -1)

			// Ensure the first message in history is from user (required by Google AI)
			while (filteredHistory.length > 0 && filteredHistory[0].role !== 'user') {
				filteredHistory.shift()
			}

			// Only proceed if we have valid history
			if (filteredHistory.length > 0) {
				const chatSession = chatModel.startChat({
					history: filteredHistory.map(msg => ({
						role: msg.role === 'user' ? 'user' : 'model',
						parts: [{ text: msg.content }]
					}))
				})

				// Add system context to the message for conversation mode
				const contextualMessage = `${config.googleAI.systemPrompt}\n\n${whatsappFormattingInstructions}${userContext}\n\nPesan pengguna: ${messageText}`
				result = await chatSession.sendMessage(contextualMessage)
			} else {
				// Fallback to standalone if no valid history
				const enhancedPrompt = `${config.googleAI.systemPrompt}

${whatsappFormattingInstructions}${userContext}

Pesan pengguna: ${messageText}`
				result = await chatModel.generateContent(enhancedPrompt)
			}
		} else {
			// No conversation mode or first message - standalone response with formatting
			const enhancedPrompt = `${config.googleAI.systemPrompt}

${whatsappFormattingInstructions}${userContext}

Pesan pengguna: ${messageText}`

			result = await chatModel.generateContent(enhancedPrompt)
		}

		const response = await result.response
		let aiText = response.text()

		// Log response details for debugging
		console.log(`📊 AI Response Stats for ${userJid}:`)
		console.log(`   Length: ${aiText.length} characters`)
		console.log(`   Mode: ${isModeActive ? 'CONVERSATION' : 'STANDALONE'}`)
		console.log(`   User: ${userName || 'Unknown'}`)
		console.log(`   Preview: ${aiText.substring(0, 200)}...`)

		// Check if response seems truncated and attempt to complete it
		if (aiText.length > 0 && !aiText.match(/[.!?]\s*$/)) {
			console.log('⚠️ Response may be truncated - attempting to complete...')
			
			// Add a completion prompt
			try {
				const completionPrompt = `Lengkapi respons ini agar berakhir dengan baik: "${aiText}"`
				const completionResult = await chatModel.generateContent(completionPrompt)
				const completionResponse = await completionResult.response
				const completion = completionResponse.text()
				
				if (completion && completion.length > 0) {
					//make sure completion is not containing the original aiText
					if (!completion.includes(aiText)) {
						aiText = aiText.trim() + ' ' + completion.trim()
					} else {
						aiText = completion
					}
					console.log('✅ Response completed successfully')
				}
			} catch (completionError) {
				console.log('❌ Failed to complete response:', completionError.message)
				// Continue with original response
			}
		}

		// Post-process the response for better WhatsApp formatting
		aiText = enhanceWhatsAppFormatting(aiText)

		// Add AI response to conversation
		addMessageToConversation(userJid, aiText, 'assistant')

		// Start timer AFTER AI responds (only if conversation mode is active)
		if (isModeActive) {
			startConversationModeTimer(userJid)
		}

		const modeStatus = isModeActive ? 'ACTIVE' : 'INACTIVE'
		console.log(`🤖 AI Response generated for ${userJid} [Mode: ${modeStatus}]: ${aiText.substring(0, 100)}...`)

		return aiText
	} catch (error) {
		console.error('❌ Error generating AI response:', error.message)

		// Indonesian error message with WhatsApp formatting
		const errorResponse = '*Maaf terjadi kesalahan* 😔\n\nSaya mengalami gangguan teknis. Silakan coba lagi atau ketik */reset* untuk memulai percakapan baru.\n\n_Terima kasih atas pengertiannya!_ 🙏'
		return errorResponse
	}
}

// Function to enhance WhatsApp formatting
function enhanceWhatsAppFormatting(text) {
	if (!config.googleAI?.useWhatsAppFormatting) {
		return text
	}

	// Ensure proper WhatsApp formatting
	let formatted = text

	// Fix bold formatting - ensure no spaces around asterisks
	formatted = formatted.replace(/\*\s*([^*]+?)\s*\*/g, '*$1*')

	// Fix italic formatting - ensure no spaces around underscores  
	formatted = formatted.replace(/_\s*([^_]+?)\s*_/g, '_$1_')

	// Fix strikethrough formatting - ensure no spaces around tildes
	formatted = formatted.replace(/~\s*([^~]+?)\s*~/g, '~$1~')

	// Fix monospace formatting - ensure proper backticks
	formatted = formatted.replace(/`\s*([^`]+?)\s*`/g, '```$1```')

	// Convert markdown-style code blocks to WhatsApp monospace
	formatted = formatted.replace(/```([^`]+?)```/g, '```$1```')

	// Convert inline code to WhatsApp monospace
	formatted = formatted.replace(/`([^`\n]+?)`/g, '```$1```')

	// Enhanced bulleted lists formatting
	formatted = formatted.replace(/^\s*[-*+]\s+(.+)$/gm, '• $1')
	formatted = formatted.replace(/^\s*•\s*(.+)$/gm, '• $1')

	// Enhanced numbered lists formatting
	formatted = formatted.replace(/^\s*(\d+)\.?\s+(.+)$/gm, '$1. $2')

	// Quote formatting - convert > to WhatsApp style
	formatted = formatted.replace(/^\s*>\s*(.+)$/gm, '❝ $1 ❞')
	formatted = formatted.replace(/^\s*"\s*(.+)"\s*$/gm, '❝ $1 ❞')

	// Auto-format important words as bold if not already formatted
	formatted = formatted.replace(/\b(PENTING|PERHATIAN|CATATAN|TIPS|INFO|WARNING|ERROR)\b/gi, '*$1*')

	// Auto-format technical terms as monospace
	formatted = formatted.replace(/\b(console\.log|function|const|let|var|npm|node|javascript|python|html|css)\b/gi, '```$1```')

	// Ensure proper spacing for lists
	formatted = formatted.replace(/(• .+)\n(• .+)/g, '$1\n$2')
	formatted = formatted.replace(/(\d+\. .+)\n(\d+\. .+)/g, '$1\n$2')

	// Clean up excessive line breaks
	formatted = formatted.replace(/\n\n\n+/g, '\n\n')

	// Ensure proper spacing around formatted elements
	formatted = formatted.replace(/([*_~`])([^\s])/g, '$1$2')
	formatted = formatted.replace(/([^\s])([*_~`])/g, '$1$2')

	// Smart emoji addition based on content context
	if (config.googleAI?.useEmojis && !formatted.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u)) {
		// Add appropriate emoji based on content context
		if (formatted.toLowerCase().includes('terima kasih') || formatted.toLowerCase().includes('thanks')) {
			formatted = formatted + ' 😊'
		} else if (formatted.toLowerCase().includes('maaf') || formatted.toLowerCase().includes('sorry')) {
			formatted = formatted + ' 🙏'
		} else if (formatted.toLowerCase().includes('selamat') || formatted.toLowerCase().includes('bagus')) {
			formatted = formatted + ' 🎉'
		} else if (formatted.toLowerCase().includes('bantuan') || formatted.toLowerCase().includes('help')) {
			formatted = formatted + ' 💡'
		} else if (formatted.toLowerCase().includes('makanan') || formatted.toLowerCase().includes('resep')) {
			formatted = formatted + ' 🍽️'
		} else if (formatted.toLowerCase().includes('programming') || formatted.toLowerCase().includes('kode')) {
			formatted = formatted + ' 💻'
		}
	}

	return formatted
}

// Handle conversation commands
function handleConversationCommand(messageText, userJid) {
	const command = messageText.toLowerCase().split(' ')[0]

	switch (command) {
		case '/ai':
		case '/chat':
			// Activate conversation mode if not active
			if (!isConversationModeActive(userJid)) {
				activateConversationMode(userJid)

				// Check if there's a message after the command
				const commandMessage = messageText.substring(command.length).trim()
				if (commandMessage) {
					// Return null to let the AI process the actual message
					return null
				} else {
					return `🎯 *Mode Percakapan Diaktifkan!*

Mantap! Sekarang kamu bisa chat denganku bebas tanpa menggunakan perintah. Aku akan mengingat konteks percakapan kita.

� Just type naturally and I'll respond!
⏰ Mode akan otomatis mati setelah 5 menit tidak ada aktivitas dari respons terakhirku.

Kamu mau ngobrol tentang apa?`
				}
			}
			return null // Let AI handle the message in conversation mode

		case '/activate':
		case '/start':
			if (isConversationModeActive(userJid)) {
				return '🎯 *Mode Percakapan Sudah Aktif*\n\nKamu bisa chat bebas! Langsung ketik pesan secara natural tanpa perintah.\n\n💡 Mode akan otomatis mati setelah 5 menit tidak ada aktivitas.'
			} else {
				activateConversationMode(userJid)
				return `🎯 *Mode Percakapan Diaktifkan!*

Perfect! Sekarang kamu bisa chat secara natural tanpa perintah.

✅ Aku akan mengingat percakapan kita
✅ Tidak perlu perintah khusus
✅ Otomatis mati setelah 5 menit tidak ada aktivitas

Mulai ngobrol! Ada yang mau dibicarakan?`
			}

		case '/deactivate':
		case '/pause':
		case '/stop':
			if (!isConversationModeActive(userJid)) {
				return '⏸️ *Mode Percakapan Tidak Aktif*\n\nGunakan `/ai` atau `/chat` untuk memulai mode percakapan.'
			} else {
				deactivateConversationMode(userJid, false) // Don't send auto notification
				return '⏸️ *Mode Percakapan Dinonaktifkan*\n\nMode sudah dimatikan. Riwayat percakapan kamu tersimpan.\n\n💡 Gunakan `/ai` atau `/chat` untuk mulai lagi jika diperlukan.'
			}

		case '/reset':
		case '/clear':
			clearConversation(userJid)
			return '🔄 *Semua Direset*\n\nRiwayat percakapan dan mode sudah dibersihkan. Mulai dari awal!\n\n💡 Gunakan `/ai` atau `/chat` untuk memulai mode percakapan.'

		case '/status':
		case '/stats':
			const stats = getConversationStats(userJid)
			if (!stats) {
				return '📊 *Tidak Ada Data Percakapan*\n\nBelum ada percakapan ditemukan.\n\n💡 Gunakan `/ai [pesan]` untuk memulai mode percakapan.'
			}

			const modeStatus = stats.conversationMode.active ?
				`🎯 *AKTIF* - Chat bebas diaktifkan!` :
				'⏸️ *TIDAK AKTIF* - Gunakan perintah atau aktifkan mode'

			return `📊 *Status Percakapan*

🔹 *Mode:* ${modeStatus}
🔹 *Total pesan:* ${stats.messageCount}
🔹 *Pesan dalam konteks:* ${stats.messagesInContext}
🔹 *Dimulai:* ${new Date(stats.createdAt).toLocaleString()}
🔹 *Aktivitas terakhir:* ${new Date(stats.lastActivity).toLocaleString()}

${stats.conversationMode.active ?
					'💬 *Chat bebas!* Mode akan mati 5 menit setelah respons terakhirku.' :
					'💡 Gunakan `/ai` untuk mengaktifkan mode percakapan.'}`

		case '/help':
			const isActive = isConversationModeActive(userJid)
			return `🤖 *Bantuan AI Chatbot*

🎯 *Mode Percakapan:* ${isActive ? '🟢 AKTIF' : '🔴 TIDAK AKTIF'}

*🚀 Mulai Cepat:*
• \`/ai\` atau \`/chat\` - Aktifkan mode percakapan
• Setelah diaktifkan: Chat bebas tanpa perintah!

*⚙️ Kontrol:*
• \`/activate\` - Aktifkan mode percakapan saja
• \`/deactivate\` - Matikan mode percakapan  
• \`/reset\` - Hapus semua riwayat percakapan
• \`/status\` - Tampilkan status saat ini

*✨ Cara Kerjanya:*
1️⃣ Gunakan \`/ai\` atau \`/chat\` untuk mengaktifkan
2️⃣ Chat secara natural - tidak perlu perintah lagi!
3️⃣ Aku akan mengingat konteks sepanjang percakapan kita
4️⃣ Mode otomatis mati setelah 5 menit tidak ada aktivitas

${isActive ?
					'🎯 *Mode AKTIF* - langsung chat natural aja!' :
					'💬 *Mulai* dengan `/ai` diikuti pesanmu!'}`

		default:
			return null
	}
}
const usePairingCode = process.argv.includes('--use-pairing-code') || config.pairing.usePairingCode

// Express server setup
const app = express()
const server = http.createServer(app)
const port = process.env.PORT || config.port

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(fileUpload({ debug: false }))

// Helper function to format phone numbers
const phoneNumberFormatter = (number) => {
	let formatted = number.replace(/\D/g, '')
	if (formatted.startsWith('0')) {
		formatted = config.defaultCountryCode + formatted.substr(1)
	}
	if (!formatted.endsWith('@s.whatsapp.net')) {
		formatted += '@s.whatsapp.net'
	}
	return formatted
}

// Helper function to format contact ID (supports both phone numbers and group IDs)
const contactIdFormatter = (input) => {
	// Check if it's already a group ID
	if (input.includes('@g.us')) {
		return input
	}
	// Check if it's already a formatted phone number
	if (input.includes('@s.whatsapp.net')) {
		return input
	}
	// Otherwise, format as phone number
	return phoneNumberFormatter(input)
}

// Basic Auth function
const checkAuth = async (basicAuth) => {
	if (!config.authRequired) return true

	if (!basicAuth) return false

	const auth = basicAuth.split(' ')[1]
	if (!auth) return false

	const [username, password] = Buffer.from(auth, 'base64').toString().split(':')
	return username === config.username && password === config.password
}

// Global variable to store the socket connection
let globalSock = null

// external map to store retry counts of messages when decryption/encryption fails
// keep this out of the socket itself, so as to prevent a message decryption/encryption loop across socket restarts
const msgRetryCounterCache = new NodeCache()

const onDemandMap = new Map()

// Read line interface
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

// start a connection
const startSock = async () => {
	const { state, saveCreds } = await useMultiFileAuthState(`session_${config.sessionName}`)
	// fetch latest version of WA Web
	const { version, isLatest } = await fetchLatestBaileysVersion()
	console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`)

	const sock = makeWASocket({
		version,
		logger,
		auth: {
			creds: state.creds,
			/** caching makes the store faster to send/recv messages */
			keys: makeCacheableSignalKeyStore(state.keys, logger),
		},
		msgRetryCounterCache,
		generateHighQualityLinkPreview: true,
		// ignore all broadcast messages -- to receive the same
		// comment the line below out
		// shouldIgnoreJid: jid => isJidBroadcast(jid),
		// implement to handle retries & poll updates
		getMessage
	})

	// Store socket globally for API use
	globalSock = sock

	// Helper function to extract user information from a message
	function getUserInfo(message, userJid) {
		let userName = null
		let senderJid = null
		
		// For group messages, extract sender information
		if (userJid.includes('@g.us')) {
			// In group messages, the actual sender is in participant field or key.participant
			senderJid = message.key?.participant || message.participant
			// Try to get pushName from message
			userName = message.pushName || null
			
			// If no pushName, try to extract from sender JID
			if (!userName && senderJid) {
				// Extract phone number from JID as fallback
				const phoneNumber = senderJid.replace('@s.whatsapp.net', '')
				userName = phoneNumber
			}
		} else {
			// For individual chats
			senderJid = userJid
			userName = message.pushName || userJid.replace('@s.whatsapp.net', '')
		}
		
		return {
			userName: userName,
			senderJid: senderJid,
			isGroup: userJid.includes('@g.us')
		}
	}

	// Helper function to check if bot is mentioned in a message
	function isBotMentioned(message, messageText) {
		console.log('🔍 Checking mentions - Bot ID:', sock?.user?.id)
		console.log('🔍 Bot LID:', sock?.user?.lid)
		console.log('🔍 Message structure:', JSON.stringify(message, null, 2))
		
		if (!sock?.user?.id) {
			console.log('❌ Bot user ID not available')
			return false
		}
		
		// Check in extendedTextMessage contextInfo mentions
		const mentions = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []
		const botJid = sock.user.id
		const botLid = sock.user.lid
		
		console.log('🔍 Found mentions:', mentions)
		console.log('🔍 Bot JID:', botJid)
		console.log('🔍 Bot LID:', botLid)
		
		// Check if bot is in mentioned list (check both JID and LID formats)
		const botMentioned = mentions.some(mention => {
			console.log('🔍 Checking mention:', mention)
			
			// Check exact JID match
			if (mention === botJid) {
				console.log('✅ Exact JID match!')
				return true
			}
			
			// Check exact LID match
			if (botLid && mention === botLid) {
				console.log('✅ Exact LID match!')
				return true
			}
			
			// Special handling for LID format differences
			// Mention: 129136915919088@lid
			// Bot LID: 129136915919088:84@lid
			if (botLid && mention.endsWith('@lid') && botLid.endsWith('@lid')) {
				const mentionBase = mention.replace('@lid', '').split(':')[0]
				const botLidBase = botLid.replace('@lid', '').split(':')[0]
				console.log('🔍 Comparing LID bases:', mentionBase, 'vs', botLidBase)
				if (mentionBase === botLidBase) {
					console.log('✅ LID base match!')
					return true
				}
			}
			
			// Check if mention includes bot's base number
			const botNumber = botJid.replace('@s.whatsapp.net', '').split(':')[0]
			const mentionNumber = mention.replace('@lid', '').replace('@s.whatsapp.net', '').split(':')[0]
			console.log('🔍 Comparing numbers:', mentionNumber, 'vs', botNumber)
			
			if (botNumber === mentionNumber) {
				console.log('✅ Number match!')
				return true
			}
			
			return false
		})
		
		if (botMentioned) {
			console.log('✅ Bot found in mentions list!')
			return true
		}
		
		// Also check message text for @[bot_number] pattern
		if (messageText) {
			const botNumber = botJid.replace('@s.whatsapp.net', '').split(':')[0]
			const mentionPattern = new RegExp(`@${botNumber}\\b`, 'i')
			console.log('🔍 Checking text pattern for:', `@${botNumber}`)
			console.log('🔍 Message text:', messageText)
			
			if (mentionPattern.test(messageText)) {
				console.log('✅ Bot found in message text pattern!')
				return true
			}
		}
		
		console.log('❌ Bot not mentioned')
		return false
	}

	// Check if message should trigger AI response
	function shouldTriggerAI(messageText, isFromMe, userJid, message = null) {
		console.log('🎯 shouldTriggerAI called for:', userJid)
		console.log('🎯 Message text:', messageText)
		console.log('🎯 From me:', isFromMe)
		console.log('🎯 Chatbot enabled:', config.features.chatbot)
		console.log('🎯 Chat model available:', !!chatModel)
		
		if (isFromMe || !config.features.chatbot || !chatModel) {
			console.log('❌ Skipping: from me, chatbot disabled, or no model')
			return false
		}

		const isGroup = userJid.includes('@g.us')
		console.log('🎯 Is group chat:', isGroup)
		
		// For group messages, only respond if bot is mentioned
		if (isGroup) {
			console.log('🎯 Group chat detected - checking mentions...')
			// Check if bot is mentioned in the message
			const botMentioned = isBotMentioned(message, messageText)
			console.log('🎯 Bot mentioned:', botMentioned)
			if (!botMentioned) {
				console.log('❌ Group message but bot not mentioned - not responding')
				return false
			}
			console.log('✅ Group message with mention - continuing checks')
			// If mentioned, continue with normal command/conversation checks
		}

		// Always respond if conversation mode is active (free conversation)
		if (isConversationModeActive(userJid)) {
			console.log('✅ Conversation mode active - will respond')
			return true
		}

		// OR if user uses specific AI commands
		const conversationCommands = [
			'/ai', '/bot', '/help', '/ask', '/chat', '/reset', '/clear', '/status', '/stats', '/activate', '/deactivate'
		]

		// Check if message starts with AI command
		const hasAICommand = conversationCommands.some(trigger =>
			messageText.toLowerCase().startsWith(trigger)
		)
		
		console.log('🎯 Has AI command:', hasAICommand)
		console.log('🎯 Final decision:', hasAICommand)

		return hasAICommand
	}

	const sendMessageWTyping = async (msg, jid) => {
		if (config.features.typing) {
			await sock.presenceSubscribe(jid)
			await delay(500)

			await sock.sendPresenceUpdate('composing', jid)
			await delay(2000)

			await sock.sendPresenceUpdate('paused', jid)
		}

		// Process mentions if message contains text
		let finalMessage = msg
		if (msg.text) {
			finalMessage = await processMentions(msg.text, jid)
		}

		await sock.sendMessage(jid, finalMessage)
	}

	// the process function lets you process all events that just occurred
	// efficiently in a batch
	sock.ev.process(
		// events is a map for event name => event data
		async (events) => {
			// something about the connection changed
			// maybe it closed, or we received all offline message or connection opened
			if (events['connection.update']) {
				const update = events['connection.update']
				const { connection, lastDisconnect, qr } = update

				// Handle QR code and pairing code
				if (qr) {
					if (usePairingCode && !sock.authState.creds.registered) {
						try {
							const phoneNumber = config.pairing.phoneNumber || await question('Please enter your phone number:\n')
							const code = await sock.requestPairingCode(phoneNumber)
							console.log(`\n🔗 Pairing code: ${code}`)
							console.log('📱 Enter this code in your WhatsApp app:')
							console.log('   1. Go to WhatsApp Settings > Linked Devices')
							console.log('   2. Tap "Link a Device"')
							console.log('   3. Tap "Link with phone number instead"')
							console.log(`   4. Enter this code: ${code}\n`)
							// Don't show QR when using pairing code
						} catch (error) {
							console.error('❌ Failed to generate pairing code:', error.message)
							console.log('📱 Falling back to QR Code - scan with WhatsApp app:')
							// Show QR as fallback when pairing fails
							qrcode.generate(qr, { small: true })
						}
					} else if (!usePairingCode) {
						console.log('📱 QR Code - scan with WhatsApp app:')
						// Show QR as image in terminal when pairing is disabled
						qrcode.generate(qr, { small: true })
					}
				}

				// Log connection updates (without QR data to keep logs clean)
				const logUpdate = { ...update }
				console.log('connection update', logUpdate)

				if (connection === 'close') {
					// Check the error code to determine if we should reconnect
					const statusCode = (lastDisconnect?.error)?.output?.statusCode
					console.log('Disconnect reason:', statusCode)

					if (statusCode !== DisconnectReason.loggedOut) {
						console.log('Reconnecting...')
						setTimeout(() => startSock(), 3000)
					} else {
						console.log('Connection closed. You are logged out.')
					}
				}

				// WARNING: THIS WILL SEND A WAM EXAMPLE AND THIS IS A ****CAPTURED MESSAGE.****
				// DO NOT ACTUALLY ENABLE THIS UNLESS YOU MODIFIED THE FILE.JSON!!!!!
				// THE ANALYTICS IN THE FILE ARE OLD. DO NOT USE THEM.
				// YOUR APP SHOULD HAVE GLOBALS AND ANALYTICS ACCURATE TO TIME, DATE AND THE SESSION
				// THIS FILE.JSON APPROACH IS JUST AN APPROACH I USED, BE FREE TO DO THIS IN ANOTHER WAY.
				// THE FIRST EVENT CONTAINS THE CONSTANT GLOBALS, EXCEPT THE seqenceNumber(in the event) and commitTime
				// THIS INCLUDES STUFF LIKE ocVersion WHICH IS CRUCIAL FOR THE PREVENTION OF THE WARNING
				const sendWAMExample = false;
				if (connection === 'open' && sendWAMExample) {
					/// sending WAM EXAMPLE
					const {
						header: {
							wamVersion,
							eventSequenceNumber,
						},
						events,
					} = JSON.parse(await fs.promises.readFile("./boot_analytics_test.json", "utf-8"))

					const binaryInfo = new BinaryInfo({
						protocolVersion: wamVersion,
						sequence: eventSequenceNumber,
						events: events
					})

					const buffer = encodeWAM(binaryInfo);

					const result = await sock.sendWAMBuffer(buffer)
					console.log(result)
				}

				console.log('connection update', update)
			}

			// credentials updated -- save them
			if (events['creds.update']) {
				await saveCreds()
			}

			if (events['labels.association']) {
				console.log(events['labels.association'])
			}


			if (events['labels.edit']) {
				console.log(events['labels.edit'])
			}

			if (events.call) {
				console.log('recv call event', events.call)
			}

			// history received
			if (events['messaging-history.set']) {
				const { chats, contacts, messages, isLatest, progress, syncType } = events['messaging-history.set']
				if (syncType === proto.HistorySync.HistorySyncType.ON_DEMAND) {
					console.log('received on-demand history sync, messages=', messages)
				}
				console.log(`recv ${chats.length} chats, ${contacts.length} contacts, ${messages.length} msgs (is latest: ${isLatest}, progress: ${progress}%), type: ${syncType}`)
			}

			// received a new message
			if (events['messages.upsert']) {
				const upsert = events['messages.upsert']
				console.log('recv messages ', JSON.stringify(upsert, undefined, 2))

				if (!!upsert.requestId) {
					console.log("placeholder message received for request of id=" + upsert.requestId, upsert)
				}



				if (upsert.type === 'notify') {
					for (const msg of upsert.messages) {
						if (msg.message?.conversation || msg.message?.extendedTextMessage?.text) {
							const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text
							if (text == "requestPlaceholder" && !upsert.requestId) {
								const messageId = await sock.requestPlaceholderResend(msg.key)
								console.log('requested placeholder resync, id=', messageId)
							}

							// go to an old chat and send this
							if (text == "onDemandHistSync") {
								const messageId = await sock.fetchMessageHistory(50, msg.key, msg.messageTimestamp)
								console.log('requested on-demand sync, id=', messageId)
							}

							if (!msg.key.fromMe && !isJidNewsletter(msg.key?.remoteJid)) {

								if (config.features.readMessages) {
									await sock.readMessages([msg.key])
								}

								// Check if should respond with AI
								if (shouldTriggerAI(text, msg.key.fromMe, msg.key.remoteJid, msg)) {
									console.log('🤖 Processing message from:', msg.key.remoteJid)

									// Extract user information
									const userInfo = getUserInfo(msg, msg.key.remoteJid)
									console.log('👤 User info extracted:', userInfo)

									// Check for conversation commands first
									const commandResponse = handleConversationCommand(text, msg.key.remoteJid)
									if (commandResponse) {
										await sendMessageWTyping({ text: commandResponse }, msg.key.remoteJid)
										return
									}

									// If it's an /ai or /chat command with message, extract the message
									let messageToProcess = text
									if (text.toLowerCase().startsWith('/ai ') || text.toLowerCase().startsWith('/chat ')) {
										const command = text.split(' ')[0]
										messageToProcess = text.substring(command.length).trim()

										// If no message after command, don't process further (command response already sent)
										if (!messageToProcess) {
											return
										}
									}

									// Generate AI response with user information
									try {
										const aiResponse = await getAIResponse(messageToProcess, msg.key.remoteJid, userInfo.userName)
										if (aiResponse) {
											await sendMessageWTyping({ text: aiResponse }, msg.key.remoteJid)
										}
									} catch (error) {
										console.error('❌ Error in AI response generation:', error)
										const errorResponse = '🔧 Sorry, I encountered a technical issue. Please try again or use /reset to start fresh.'
										await sendMessageWTyping({ text: errorResponse }, msg.key.remoteJid)
									}
								} else if (doReplies && !msg.key.remoteJid.includes('@g.us')) {
									// Only auto-reply in individual chats, not groups
									console.log('replying to', msg.key.remoteJid)
									await sendMessageWTyping({ text: 'Hello there!' }, msg.key.remoteJid)
								}
							}
						}
					}
				}
			}

			// messages updated like status delivered, message deleted etc.
			if (events['messages.update']) {
				console.log(
					JSON.stringify(events['messages.update'], undefined, 2)
				)

				for (const { key, update } of events['messages.update']) {
					if (update.pollUpdates) {
						const pollCreation = {} // get the poll creation message somehow
						if (pollCreation) {
							console.log(
								'got poll update, aggregation: ',
								getAggregateVotesInPollMessage({
									message: pollCreation,
									pollUpdates: update.pollUpdates,
								})
							)
						}
					}
				}
			}

			if (events['message-receipt.update']) {
				console.log(events['message-receipt.update'])
			}

			if (events['messages.reaction']) {
				console.log(events['messages.reaction'])
			}

			if (events['presence.update']) {
				console.log(events['presence.update'])
			}

			if (events['chats.update']) {
				console.log(events['chats.update'])
			}

			if (events['contacts.update']) {
				for (const contact of events['contacts.update']) {
					if (typeof contact.imgUrl !== 'undefined') {
						const newUrl = contact.imgUrl === null
							? null
							: await sock.profilePictureUrl(contact.id).catch(() => null)
						console.log(
							`contact ${contact.id} has a new profile pic: ${newUrl}`,
						)
					}
				}
			}

			if (events['chats.delete']) {
				console.log('chats deleted ', events['chats.delete'])
			}
		}
	)

	// API Endpoints
	app.get('/info', async (req, res) => {
		try {
			const basicAuth = req.header('authorization')
			if (await checkAuth(basicAuth) === false) {
				return res.status(401).json({
					status: false,
					response: 'Unauthorized'
				})
			}

			res.status(200).json({
				status: true,
				response: sock.user
			})
		} catch (err) {
			res.status(500).json({
				status: false,
				response: err.message
			})
		}
	})

	// Function to process mentions in messages
	async function processMentions(message, contactId) {
		// Find all @mentions in the message using regex
		const mentionPattern = /@(\w+)/g
		const mentions = []
		let match
		let processedMessage = message

		// Extract all @mentions from the message
		while ((match = mentionPattern.exec(message)) !== null) {
			const mentionText = match[1] // The text after @
			mentions.push({
				text: match[0], // Full @mention
				username: mentionText,
				index: match.index
			})
		}

		// If no mentions found, return original message
		if (mentions.length === 0) {
			return { text: message }
		}

		// Check if this is a group chat
		const isGroup = contactId.includes('@g.us')
		
		if (!isGroup) {
			// For individual chats, mentions don't work, return original message
			return { text: message }
		}

		try {
			// Get group metadata to find participants
			const groupMetadata = await sock.groupMetadata(contactId)
			const participants = groupMetadata.participants

			const mentionedJids = []
			let formattedMessage = message

			// Process each mention
			for (const mention of mentions.reverse()) { // Reverse to maintain string indices
				let mentionedJid = null

				// Try to find participant by various methods
				for (const participant of participants) {
					const participantNumber = participant.id.split('@')[0]
					const participantJid = participant.id

					// Check if mention matches:
					// 1. Phone number
					// 2. Contact name (if available)
					// 3. Participant ID
					if (mention.username === participantNumber ||
						mention.username.toLowerCase() === participantNumber ||
						participantJid.includes(mention.username)) {
						mentionedJid = participantJid
						break
					}
				}

				// If found a valid participant, add to mentions
				if (mentionedJid) {
					mentionedJids.push(mentionedJid)
				}
			}

			// Return message with mentions if any valid mentions found
			if (mentionedJids.length > 0) {
				return {
					text: message,
					mentions: mentionedJids
				}
			}

			// If no valid mentions found, return original message
			return { text: message }

		} catch (error) {
			console.log(`⚠️ Error processing mentions for ${contactId}:`, error.message)
			// Return original message if error occurs
			return { text: message }
		}
	}

	app.post('/send-message', [
		body('number').notEmpty(),
		body('message').notEmpty()
	], async (req, res) => {
		try {
			const basicAuth = req.header('authorization')
			if (await checkAuth(basicAuth) === false) {
				return res.status(401).json({
					status: false,
					response: 'Unauthorized'
				})
			}

			const errors = validationResult(req).formatWith(({ msg }) => {
				return msg
			})

			if (!errors.isEmpty()) {
				return res.status(422).json({
					status: false,
					response: errors.mapped()
				})
			}

			const contactId = contactIdFormatter(req.body.number)
			const message = req.body.message

			// For phone numbers (not groups), check if number is registered on WhatsApp
			if (contactId.endsWith('@s.whatsapp.net')) {
				const isRegisteredNumber = await sock.onWhatsApp(contactId)
				if (isRegisteredNumber.length == 0) {
					return res.status(422).json({
						status: false,
						response: 'The number is not registered'
					})
				}
			}

			// Process mentions in the message
			const messageWithMentions = await processMentions(message, contactId)

			const info = await sock.sendMessage(contactId, messageWithMentions)
			res.status(200).json({
				status: true,
				response: info
			})
		} catch (err) {
			res.status(500).json({
				status: false,
				response: err.message
			})
		}
	})

	app.post('/send-group-message', [
		body('id').notEmpty(),
		body('message').notEmpty()
	], async (req, res) => {
		try {
			const basicAuth = req.header('authorization')
			if (await checkAuth(basicAuth) === false) {
				return res.status(401).json({
					status: false,
					response: 'Unauthorized'
				})
			}

			const errors = validationResult(req).formatWith(({ msg }) => {
				return msg
			})

			if (!errors.isEmpty()) {
				return res.status(422).json({
					status: false,
					response: errors.mapped()
				})
			}

			const chatId = req.body.id
			const message = req.body.message

			// Process mentions in the message
			const messageWithMentions = await processMentions(message, chatId)

			const info = await sock.sendMessage(chatId, messageWithMentions)
			res.status(200).json({
				status: true,
				response: info
			})
		} catch (err) {
			res.status(500).json({
				status: false,
				response: err.message
			})
		}
	})

	app.post('/send-media', [
		body('number').notEmpty(),
		body('caption').optional()
	], async (req, res) => {
		try {
			const basicAuth = req.header('authorization')
			if (await checkAuth(basicAuth) === false) {
				return res.status(401).json({
					status: false,
					response: 'Unauthorized'
				})
			}

			const errors = validationResult(req).formatWith(({ msg }) => {
				return msg
			})

			if (!errors.isEmpty()) {
				return res.status(422).json({
					status: false,
					response: errors.mapped()
				})
			}

			const contactId = contactIdFormatter(req.body.number)
			const caption = req.body.caption || ''

			let fileData, fileName, mimeType
			let tempFilePath = null

			// Check for file upload (multipart/form-data)
			if (req.files && req.files.file) {
				const file = req.files.file
				fileData = file.data
				fileName = req.body.fileName || file.name || ''
				mimeType = file.mimetype
			}
			// Check for base64 data in req.body.file
			else if (req.body.file && req.body.file.startsWith('data:')) {
				try {
					// Handle data URL format: data:image/png;base64,iVBORw0KGgo...
					const [header, base64Data] = req.body.file.split(',')
					const mimeMatch = header.match(/data:([^;]+)/)
					mimeType = mimeMatch ? mimeMatch[1] : req.body.mimeType || 'application/octet-stream'
					fileData = Buffer.from(base64Data, 'base64')
					fileName = req.body.fileName || ''
				} catch (error) {
					return res.status(422).json({
						status: false,
						response: 'Invalid base64 data URL format'
					})
				}
			}
			else if (req.body.file && req.body.file.match(/^[A-Za-z0-9+/]+=*$/)) {
				try {
					// Handle plain base64 string
					fileData = Buffer.from(req.body.file, 'base64')
					fileName = req.body.fileName || ''
					mimeType = req.body.mimeType || 'application/octet-stream'
				} catch (error) {
					return res.status(422).json({
						status: false,
						response: 'Invalid base64 data'
					})
				}
			}
			// Check for URL in req.body.file
			else if (req.body.file && (req.body.file.startsWith('http://') || req.body.file.startsWith('https://'))) {
				try {
					const response = await fetch(req.body.file)
					if (!response.ok) {
						throw new Error(`HTTP ${response.status}`)
					}
					const arrayBuffer = await response.arrayBuffer()
					fileData = Buffer.from(arrayBuffer)
					fileName = req.body.fileName || req.body.file.split('/').pop().split('?')[0] || ''
					mimeType = response.headers.get('content-type') || req.body.mimeType || 'application/octet-stream'
				} catch (error) {
					return res.status(422).json({
						status: false,
						response: `Failed to fetch URL: ${error.message}`
					})
				}
			}
			else {
				return res.status(422).json({
					status: false,
					response: 'No file provided. Use file upload, base64 data, or URL in the file field'
				})
			}

			// For phone numbers (not groups), check if number is registered on WhatsApp
			if (contactId.endsWith('@s.whatsapp.net')) {
				const isRegisteredNumber = await sock.onWhatsApp(contactId)
				if (isRegisteredNumber.length == 0) {
					return res.status(422).json({
						status: false,
						response: 'The number is not registered'
					})
				}
			}

			// Determine media type based on file mimetype
			let mediaType = 'document'
			if (mimeType.startsWith('image/')) {
				mediaType = 'image'
			} else if (mimeType.startsWith('video/')) {
				mediaType = 'video'
			} else if (mimeType.startsWith('audio/')) {
				mediaType = 'audio'
			}

			const mediaMessage = {
				[mediaType]: fileData,
				caption: caption,
				mimetype: mimeType,
				fileName: fileName
			}

			const info = await sock.sendMessage(contactId, mediaMessage)

			// Clean up temporary file if it was created
			if (tempFilePath) {
				try {
					fs.unlinkSync(tempFilePath)
				} catch (cleanupError) {
					console.warn('Failed to cleanup temp file:', cleanupError.message)
				}
			}

			res.status(200).json({
				status: true,
				response: info
			})
		} catch (err) {
			// Clean up temporary file on error
			if (tempFilePath) {
				try {
					fs.unlinkSync(tempFilePath)
				} catch (cleanupError) {
					console.warn('Failed to cleanup temp file on error:', cleanupError.message)
				}
			}

			res.status(500).json({
				status: false,
				response: err.message
			})
		}
	})

	app.get('/get-groups', async (req, res) => {
		try {
			const basicAuth = req.header('authorization')
			if (await checkAuth(basicAuth) === false) {
				return res.status(401).json({
					status: false,
					response: 'Unauthorized'
				})
			}

			const groups = await sock.groupFetchAllParticipating()
			const result = Object.values(groups).map(group => ({
				id: group.id,
				name: group.subject,
				participants: group.participants.length,
				description: group.desc
			}))

			res.status(200).json({
				status: true,
				response: result
			})
		} catch (err) {
			res.status(500).json({
				status: false,
				response: err.message
			})
		}
	})

	app.get('/get-config', async (req, res) => {
		try {
			const basicAuth = req.header('authorization')
			if (await checkAuth(basicAuth) === false) {
				return res.status(401).json({
					status: false,
					response: 'Unauthorized'
				})
			}

			// Return config without sensitive data
			const safeConfig = { ...config }
			delete safeConfig.username
			delete safeConfig.password

			res.status(200).json({
				status: true,
				response: safeConfig
			})
		} catch (err) {
			res.status(500).json({
				status: false,
				response: err.message
			})
		}
	})

	// Check if a number is registered on WhatsApp (GET endpoint)
	app.get('/is-registered', async (req, res) => {
		try {
			const basicAuth = req.header('authorization')
			if (await checkAuth(basicAuth) === false) {
				return res.status(401).json({
					status: false,
					response: 'Unauthorized'
				})
			}

			const numberRaw = req.query.number
			if (!numberRaw) {
				return res.status(422).json({
					status: false,
					response: { number: 'Number is required' }
				})
			}

			const contactId = contactIdFormatter(numberRaw)

			// For group IDs, we can't check registration status the same way
			if (contactId.endsWith('@g.us')) {
				res.status(200).json({
					status: true,
					response: {
						contactId: contactId,
						isGroup: true,
						isRegistered: true // Groups are considered "registered" if they have a valid format
					}
				})
				return
			}

			// For phone numbers, check if registered on WhatsApp
			const isRegisteredNumber = await sock.onWhatsApp(contactId)

			res.status(200).json({
				status: true,
				response: {
					contactId: contactId,
					isGroup: false,
					isRegistered: isRegisteredNumber.length > 0
				}
			})
		} catch (err) {
			res.status(500).json({
				status: false,
				response: err.message
			})
		}
	})

	// AI Chat endpoint
	// Conversation Management API Endpoints

	// Get conversation stats
	app.get('/conversation-stats/:number', async (req, res) => {
		try {
			const basicAuth = req.header('authorization')
			if (await checkAuth(basicAuth) === false) {
				return res.status(401).json({
					status: false,
					response: 'Unauthorized'
				})
			}

			const contactId = contactIdFormatter(req.params.number)
			const stats = getConversationStats(contactId)

			res.status(200).json({
				status: true,
				response: stats || {
					messageCount: 0,
					messagesInContext: 0,
					hasActiveConversation: false
				}
			})
		} catch (err) {
			res.status(500).json({
				status: false,
				response: err.message
			})
		}
	})

	// Get conversation history
	app.get('/conversation-history/:number', async (req, res) => {
		try {
			const basicAuth = req.header('authorization')
			if (await checkAuth(basicAuth) === false) {
				return res.status(401).json({
					status: false,
					response: 'Unauthorized'
				})
			}

			const contactId = contactIdFormatter(req.params.number)
			const history = getConversationContext(contactId)

			res.status(200).json({
				status: true,
				response: {
					conversationId: getConversationKey(contactId),
					messageCount: history.length,
					messages: history.map(msg => ({
						id: msg.id,
						role: msg.role,
						content: msg.content,
						timestamp: new Date(msg.timestamp).toISOString()
					}))
				}
			})
		} catch (err) {
			res.status(500).json({
				status: false,
				response: err.message
			})
		}
	})

	// Clear conversation
	app.delete('/conversation/:number', async (req, res) => {
		try {
			const basicAuth = req.header('authorization')
			if (await checkAuth(basicAuth) === false) {
				return res.status(401).json({
					status: false,
					response: 'Unauthorized'
				})
			}

			const contactId = contactIdFormatter(req.params.number)
			clearConversation(contactId)

			res.status(200).json({
				status: true,
				response: 'Conversation cleared successfully'
			})
		} catch (err) {
			res.status(500).json({
				status: false,
				response: err.message
			})
		}
	})

	// Activate conversation mode
	app.post('/conversation-mode/:number/activate', async (req, res) => {
		try {
			const basicAuth = req.header('authorization')
			if (await checkAuth(basicAuth) === false) {
				return res.status(401).json({
					status: false,
					response: 'Unauthorized'
				})
			}

			const contactId = contactIdFormatter(req.params.number)
			const success = activateConversationMode(contactId)

			res.status(200).json({
				status: true,
				response: {
					activated: success,
					message: 'Conversation mode activated',
					timeoutMinutes: CONVERSATION_CONFIG.conversationModeTimeout / 60000
				}
			})
		} catch (err) {
			res.status(500).json({
				status: false,
				response: err.message
			})
		}
	})

	// Deactivate conversation mode
	app.post('/conversation-mode/:number/deactivate', async (req, res) => {
		try {
			const basicAuth = req.header('authorization')
			if (await checkAuth(basicAuth) === false) {
				return res.status(401).json({
					status: false,
					response: 'Unauthorized'
				})
			}

			const contactId = contactIdFormatter(req.params.number)
			const sendNotification = req.body.sendNotification === true
			const success = deactivateConversationMode(contactId, sendNotification)

			res.status(200).json({
				status: true,
				response: {
					deactivated: success,
					message: 'Conversation mode deactivated',
					notificationSent: sendNotification
				}
			})
		} catch (err) {
			res.status(500).json({
				status: false,
				response: err.message
			})
		}
	})

	// Get conversation mode status
	app.get('/conversation-mode/:number', async (req, res) => {
		try {
			const basicAuth = req.header('authorization')
			if (await checkAuth(basicAuth) === false) {
				return res.status(401).json({
					status: false,
					response: 'Unauthorized'
				})
			}

			const contactId = contactIdFormatter(req.params.number)
			const isActive = isConversationModeActive(contactId)
			const stats = getConversationStats(contactId)

			res.status(200).json({
				status: true,
				response: {
					active: isActive,
					timeoutMinutes: CONVERSATION_CONFIG.conversationModeTimeout / 60000,
					stats: stats ? stats.conversationMode : null
				}
			})
		} catch (err) {
			res.status(500).json({
				status: false,
				response: err.message
			})
		}
	})

	// Get all active conversations
	app.get('/conversations', async (req, res) => {
		try {
			const basicAuth = req.header('authorization')
			if (await checkAuth(basicAuth) === false) {
				return res.status(401).json({
					status: false,
					response: 'Unauthorized'
				})
			}

			const conversations = []
			for (const [key, conversation] of conversationMemory.entries()) {
				conversations.push({
					conversationId: key,
					userJid: conversation.userInfo.jid,
					isGroup: conversation.userInfo.isGroup,
					messageCount: conversation.messageCount,
					messagesInContext: conversation.messages.length,
					createdAt: new Date(conversation.createdAt).toISOString(),
					lastActivity: new Date(conversation.lastActivity).toISOString()
				})
			}

			res.status(200).json({
				status: true,
				response: {
					totalConversations: conversations.length,
					conversations: conversations
				}
			})
		} catch (err) {
			res.status(500).json({
				status: false,
				response: err.message
			})
		}
	})

	app.post('/ai-chat', [
		body('number').notEmpty(),
		body('message').notEmpty()
	], async (req, res) => {
		try {
			const basicAuth = req.header('authorization')
			if (await checkAuth(basicAuth) === false) {
				return res.status(401).json({
					status: false,
					response: 'Unauthorized'
				})
			}

			const errors = validationResult(req).formatWith(({ msg }) => {
				return msg
			})

			if (!errors.isEmpty()) {
				return res.status(422).json({
					status: false,
					response: errors.mapped()
				})
			}

			if (!chatModel) {
				return res.status(503).json({
					status: false,
					response: 'AI chatbot is not configured or available'
				})
			}

			const contactId = contactIdFormatter(req.body.number)
			const message = req.body.message
			const userName = req.body.userName || null // Optional userName parameter

			// For phone numbers (not groups), check if number is registered on WhatsApp
			if (contactId.endsWith('@s.whatsapp.net')) {
				const isRegisteredNumber = await sock.onWhatsApp(contactId)
				if (isRegisteredNumber.length == 0) {
					return res.status(422).json({
						status: false,
						response: 'The number is not registered'
					})
				}
			}

			// Generate AI response with userName
			const aiResponse = await getAIResponse(message, contactId, userName)
			if (!aiResponse) {
				return res.status(500).json({
					status: false,
					response: 'Failed to generate AI response'
				})
			}

			// Process mentions in AI response
			const aiResponseWithMentions = await processMentions(aiResponse, contactId)

			// Send AI response
			const info = await sock.sendMessage(contactId, aiResponseWithMentions)

			res.status(200).json({
				status: true,
				response: {
					messageInfo: info,
					aiResponse: aiResponse,
					originalMessage: message,
					userName: userName
				}
			})
		} catch (err) {
			res.status(500).json({
				status: false,
				response: err.message
			})
		}
	})

	return sock

	async function getMessage(key) {
		// Implement a way to retreive messages that were upserted from messages.upsert
		// up to you

		// only if store is present
		return proto.Message.fromObject({ conversation: 'test' })
	}
}

// Start the WhatsApp connection
startSock().then(() => {
	// Start Express server after WhatsApp connection is established
	server.listen(port, () => {
		console.log(`\n🚀 ${config.name} running on http://${config.appUrl}:${port}`)
		console.log(`📱 Bot Name: ${config.botName}`)
		console.log(`🔐 Auth Required: ${config.authRequired ? 'Yes' : 'No'}`)
		console.log('\n📋 Available API endpoints:')
		console.log(`   GET  /info - Get bot info`)
		console.log(`   POST /send-message - Send message to individual or group`)
		console.log(`   POST /send-media - Send media to individual or group`)
		console.log(`   POST /send-group-message - Send message to group`)
		console.log(`   POST /ai-chat - Send message and get AI response`)
		console.log(`   GET  /is-registered - Check if number/group is registered`)
		console.log(`   GET  /get-groups - Get all groups`)
		console.log(`   GET  /get-config - Get configuration`)
		console.log('\n🧠 Conversation Management:')
		console.log(`   GET  /conversations - Get all active conversations`)
		console.log(`   GET  /conversation-stats/:number - Get conversation statistics`)
		console.log(`   GET  /conversation-history/:number - Get conversation history`)
		console.log(`   DELETE /conversation/:number - Clear conversation`)
		console.log('\n🎯 Conversation Mode Control:')
		console.log(`   GET  /conversation-mode/:number - Get conversation mode status`)
		console.log(`   POST /conversation-mode/:number/activate - Activate conversation mode`)
		console.log(`   POST /conversation-mode/:number/deactivate - Deactivate conversation mode`)

		if (config.authRequired) {
			console.log(`\n🔑 Use Basic Auth: ${config.username}:${config.password}`)
		}

		if (config.features.chatbot && chatModel) {
			console.log(`\n🤖 AI Chatbot Features:`)
			console.log(`   • Auto-respond to questions: ${doReplies ? 'Yes' : 'No'}`)
			console.log(`   • AI triggers: /ai, /bot, /help, /ask, /chat`)
			console.log(`   • Commands: /reset, /clear, /status, /stats, /activate, /deactivate`)
			console.log(`   • Model: ${config.googleAI.model}`)
			console.log(`   • Max tokens: ${config.googleAI.maxTokens}`)
			console.log(`   • Conversation context: ${CONVERSATION_CONFIG.maxHistoryLength} messages`)
			console.log(`   • Context timeout: ${CONVERSATION_CONFIG.conversationTimeout / 60000} minutes`)
			console.log(`   🎯 Conversation Mode: ${CONVERSATION_CONFIG.conversationModeTimeout / 60000} min timeout`)
			console.log(`   • Memory management: Automatic cleanup enabled`)
			console.log(`   • Inactivity notifications: Enabled`)
		}
	})
}).catch(err => {
	console.error('Failed to start WhatsApp connection:', err)
})