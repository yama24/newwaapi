#!/usr/bin/env node

const fs = require('fs')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (text) => new Promise((resolve) => rl.question(text, resolve))

async function setup() {
  console.log('🚀 WhatsApp API Setup')
  console.log('===================\n')

  // Check if config exists
  if (fs.existsSync('./config/config.json')) {
    const answer = await question('Config file already exists. Overwrite? (y/N): ')
    if (answer.toLowerCase() !== 'y') {
      console.log('Setup cancelled.')
      rl.close()
      return
    }
  }

  // Get basic configuration
  const appName = await question('Enter application name [New WhatsApp API]: ') || 'New WhatsApp API'
  const botName = await question('Enter bot name [WA API Bot]: ') || 'WA API Bot'
  const sessionName = await question('Enter session name [newsession]: ') || 'newsession'
  const logLevel = await question('Enter log level (error/warn/info/debug) [error]: ') || 'error'
  const logFile = await question('Enter log file name [wa-logs.json]: ') || 'wa-logs.json'
  const appUrl = await question('Enter application URL [localhost]: ') || 'localhost'
  const port = await question('Enter port [3000]: ') || '3000'
  const countryCode = await question('Enter default country code [62]: ') || '62'

  const authRequired = await question('Enable authentication? (y/N): ')
  let username = 'admin'
  let password = 'admin123'

  if (authRequired.toLowerCase() === 'y') {
    username = await question('Enter username [admin]: ') || 'admin'
    password = await question('Enter password [admin123]: ') || 'admin123'
  }

  const usePairingCode = await question('Use pairing code instead of QR? (Y/n): ')
  let phoneNumber = ''

  if (usePairingCode.toLowerCase() !== 'n') {
    phoneNumber = await question('Enter your phone number (optional): ') || ''
  }

  const autoReply = await question('Enable auto-reply feature? (y/N): ')
  const readMessages = await question('Enable read messages feature? (Y/n): ')
  const typing = await question('Enable typing indicator feature? (Y/n): ')

  // AI Chatbot configuration
  const enableChatbot = await question('Enable AI Chatbot powered by Google Gemini? (Y/n): ')
  let googleAI = {}

  if (enableChatbot.toLowerCase() !== 'n') {
    console.log('\n🤖 AI Chatbot Configuration:')
    const apiKey = await question('Enter Google Gemini API Key (get from https://aistudio.google.com/): ')
    const model = await question('Enter AI model [gemini-1.5-flash]: ') || 'gemini-1.5-flash'
    const maxTokens = await question('Enter max tokens [1000]: ') || '1000'
    const temperature = await question('Enter temperature (0-1) [0.7]: ') || '0.7'
    const language = await question('Choose language (indonesian/english) [indonesian]: ') || 'indonesian'

    const systemPrompt = language === 'english'
      ? "You are a helpful WhatsApp AI assistant. Keep responses concise and friendly. Use WhatsApp formatting and appropriate emojis. Respond in the same language as the user."
      : "Anda adalah asisten AI WhatsApp yang membantu dalam bahasa Indonesia. Berikan respons singkat, jelas, dan ramah. Gunakan format WhatsApp dengan emoji yang sesuai."

    googleAI = {
      "apiKey": apiKey,
      "model": model,
      "maxTokens": parseInt(maxTokens),
      "temperature": parseFloat(temperature),
      "systemPrompt": systemPrompt,
      "whatsappFormatting": true,
      "conversationTimeout": 1800000,
      "conversationModeTimeout": 300000
    }
  }

  // Create config
  const config = {
    "name": appName,
    "botName": botName,
    "sessionName": sessionName,
    "levelLog": logLevel,
    "logFileName": logFile,
    "appUrl": appUrl,
    "port": parseInt(port),
    "defaultCountryCode": parseInt(countryCode),

    "username": username,
    "password": password,
    "authRequired": authRequired.toLowerCase() === 'y',
    "pairing": {
      "usePairingCode": usePairingCode.toLowerCase() !== 'n',
      "phoneNumber": phoneNumber
    },
    "features": {
      "autoReply": autoReply.toLowerCase() === 'y',
      "readMessages": readMessages.toLowerCase() !== 'n',
      "typing": typing.toLowerCase() !== 'n',
      "chatbot": enableChatbot.toLowerCase() !== 'n'
    }
  }

  // Add Google AI config if enabled
  if (enableChatbot.toLowerCase() !== 'n') {
    config.googleAI = googleAI
  }

  // Write config file
  fs.writeFileSync('./config/config.json', JSON.stringify(config, null, 2))

  console.log('\n✅ Configuration saved!')
  console.log('📁 Config file: ./config/config.json')

  if (enableChatbot.toLowerCase() !== 'n') {
    console.log('\n🤖 AI Chatbot enabled!')
    console.log('📚 Check docs/guides/PANDUAN_AI_CHATBOT.md for usage guide in Indonesian')
    console.log('📚 Check docs/guides/AI_CHATBOT_SETUP.md for detailed English guide')
    console.log('🧪 Test with: ./test-ai-chat-indonesia.sh')
  }

  console.log('\n🚀 To start the server, run:')
  console.log('   npm start')

  if (config.authRequired) {
    console.log('\n🔐 Authentication enabled:')
    console.log(`   Username: ${username}`)
    console.log(`   Password: ${password}`)
  }

  rl.close()
}

setup().catch(console.error)
