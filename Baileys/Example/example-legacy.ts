import { Boom } from '@hapi/boom'
import { AnyMessageContent, delay, DisconnectReason, fetchLatestBaileysVersion, makeInMemoryStore, makeWALegacySocket, useSingleFileLegacyAuthState } from '../src'
import MAIN_LOGGER from '../src/Utils/logger'

const logger = MAIN_LOGGER.child({ })
logger.level = 'debug'
// the store maintains the data of the WA connection in memory
// can be written out to a file & read from it
const store = makeInMemoryStore({ logger })
store.readFromFile('./baileys_store.json')
// save every 10s
setInterval(() => {
	store.writeToFile('./baileys_store.json')
}, 10_000)

const { state, saveState } = useSingleFileLegacyAuthState('./auth_info.json')

// start a connection
const startSock = async() => {
	// fetch latest version of WA Web
	const { version, isLatest } = await fetchLatestBaileysVersion()
	console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`)

	const sock = makeWALegacySocket({
		version,
		logger,
		printQRInTerminal: true,
		auth: state
	})
	store.bind(sock.ev)

	const sendMessageWTyping = async(msg: AnyMessageContent, jid: string) => {
		await sock.presenceSubscribe(jid)
		await delay(500)

		await sock.sendPresenceUpdate('composing', jid)
		await delay(2000)

		await sock.sendPresenceUpdate('paused', jid)

		await sock.sendMessage(jid, msg)
	}

	sock.ev.on('messages.upsert', async m => {
		if(m.type === 'append' || m.type === 'notify') {
			console.log(JSON.stringify(m, undefined, 2))
		}

		const msg = m.messages[0]
		if(!msg.key.fromMe && m.type === 'notify') {
			console.log('replying to', m.messages[0].key.remoteJid)
			await sock!.chatRead(msg.key, 1)
			await sendMessageWTyping({ text: 'Hello there!' }, msg.key.remoteJid)
		}

	})

	sock.ev.on('messages.update', m => console.log(JSON.stringify(m, undefined, 2)))
	sock.ev.on('presence.update', m => console.log(m))
	sock.ev.on('chats.update', m => console.log(m))
	sock.ev.on('contacts.update', m => console.log(m))

	sock.ev.on('connection.update', (update) => {
		const { connection, lastDisconnect } = update
		if(connection === 'close') {
			// reconnect if not logged out
			if((lastDisconnect.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut) {
				startSock()
			} else {
				console.log('connection closed')
			}
		}

		console.log('connection update', update)
	})
	// listen for when the auth credentials is updated
	sock.ev.on('creds.update', saveState)

	return sock
}

startSock()