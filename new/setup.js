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
  if (fs.existsSync('./config.json')) {
    const answer = await question('Config file already exists. Overwrite? (y/N): ')
    if (answer.toLowerCase() !== 'y') {
      console.log('Setup cancelled.')
      rl.close()
      return
    }
  }

  // Get basic configuration
  const botName = await question('Enter bot name [WA API Bot]: ') || 'WA API Bot'
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

  // Create config
  const config = {
    "name": "New WhatsApp API",
    "botName": botName,
    "sessionName": "newsession",
    "levelLog": "error",
    "logFileName": "wa-logs.json",
    "appUrl": "localhost",
    "port": parseInt(port),
    "defaultCountryCode": parseInt(countryCode),
    "downloadMedia": false,
    "downloadFolder": "media",
    "webhook": "",
    "notifTo": "",
    "commander": [],
    "username": username,
    "password": password,
    "authRequired": authRequired.toLowerCase() === 'y',
    "pairing": {
      "usePairingCode": usePairingCode.toLowerCase() !== 'n',
      "phoneNumber": phoneNumber
    },
    "features": {
      "autoReply": false,
      "readMessages": true,
      "typing": true
    }
  }

  // Write config file
  fs.writeFileSync('./config.json', JSON.stringify(config, null, 2))

  console.log('\n✅ Configuration saved!')
  console.log('📁 Config file: ./config.json')
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
