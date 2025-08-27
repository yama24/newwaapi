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

// Load configuration
let config
try {
	config = JSON.parse(fs.readFileSync('./config.json', 'utf8'))
} catch (error) {
	console.error('❌ Config file not found or invalid. Please copy config.json.example to config.json and configure it.')
	process.exit(1)
}

const logger = P({
	timestamp: () => `,"time":"${moment().tz(config.timezone || 'UTC').format()}"`
}, P.destination(`./${config.logFileName}`))
logger.level = config.levelLog

const doReplies = process.argv.includes('--do-reply') || config.features.autoReply
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

	const sendMessageWTyping = async (msg, jid) => {
		if (config.features.typing) {
			await sock.presenceSubscribe(jid)
			await delay(500)

			await sock.sendPresenceUpdate('composing', jid)
			await delay(2000)

			await sock.sendPresenceUpdate('paused', jid)
		}

		await sock.sendMessage(jid, msg)
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
								if (doReplies) {
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

			const info = await sock.sendMessage(contactId, { text: message })
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

			const info = await sock.sendMessage(chatId, { text: message })
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
		console.log(`   GET  /is-registered - Check if number/group is registered`)
		console.log(`   GET  /get-groups - Get all groups`)
		console.log(`   GET  /get-config - Get configuration`)

		if (config.authRequired) {
			console.log(`\n🔑 Use Basic Auth: ${config.username}:${config.password}`)
		}
	})
}).catch(err => {
	console.error('Failed to start WhatsApp connection:', err)
})