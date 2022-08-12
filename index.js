
"use strict";
const { default: makeWASocket, AnyMessageContent, delay, DisconnectReason, fetchLatestBaileysVersion, makeInMemoryStore, MessageRetryMap, useMultiFileAuthState } = require("@adiwajshing/baileys")
const figlet = require("figlet");
const fs = require("fs");
const chalk = require('chalk')
const logg = require('pino')


const { serialize } = require("./lib/myfunc");
const { color, mylog, infolog } = require("./lib/color");

let setting = JSON.parse(fs.readFileSync('./config.json'));

const useStore = !process.argv.includes('--no-store')
const doReplies = !process.argv.includes('--no-reply')


// judul console
function title() {
    console.clear()
    console.log()
    console.log(chalk.bold.green(figlet.textSync(' ' + setting.name + ' ', {
        font: 'Pagga',
    })))
}

const store = useStore ? makeInMemoryStore({ logger: logg().child({ level: setting.levelLog, stream: 'store' }) }) : undefined

store?.readFromFile(setting.logFileName)
// save every 10s
setInterval(() => {
    store?.writeToFile(setting.logFileName)
}, 10_000)

const connectToWhatsApp = async () => {
    const { state, saveCreds } = await useMultiFileAuthState(setting.sessionName)
    // fetch latest version of WA Web
    const { version, isLatest } = await fetchLatestBaileysVersion()
    title()
    console.log(chalk.bold.green(`using WA v${version.join('.')}, isLatest: ${isLatest}`))

    const conn = makeWASocket({
        printQRInTerminal: true,
        logger: logg({ level: setting.levelLog }),
        auth: state,
        browser: [setting.botName, "MacOS", "3.0"],
    })
    store.bind(conn.ev)

    conn.multi = true


    const sendMessageWTyping = async (AnyMessageContent, string) => {
        await conn.presenceSubscribe(string)
        await delay(500)

        await conn.sendPresenceUpdate('composing', string)
        await delay(2000)

        await conn.sendPresenceUpdate('paused', string)

        await conn.sendMessage(string, AnyMessageContent)
    }

    conn.ev.process(
        // events is a map for event name => event data
        async (events) => {
            // something about the connection changed
            // maybe it closed, or we received all offline message or connection opened
            if (events['connection.update']) {
                const update = events['connection.update']
                const { connection, lastDisconnect } = update
                if (connection === 'close') {
                    console.log(mylog('Server Ready ✓'))
                    // reconnect if not logged out
                    if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) {
                        connectToWhatsApp()
                    } else {
                        console.log(mylog('Wa web terlogout...'))
                        fs.rmSync(setting.sessionName, { recursive: true, force: true });
                        fs.rmSync(setting.logFileName, { recursive: true, force: true });
                        connectToWhatsApp()
                    }
                }
            }
            if (events['creds.update']) {
                saveCreds()
            }
            if (events.call) {
                console.log('recv call event', events.call)
            }
            // chat history received
            if (events['chats.set']) {
                const { chats, isLatest } = events['chats.set']
                console.log(`recv ${chats.length} chats (is latest: ${isLatest})`)
            }

            // message history received
            if (events['messages.set']) {
                const { messages, isLatest } = events['messages.set']
                console.log(`recv ${messages.length} messages (is latest: ${isLatest})`)
            }

            if (events['contacts.set']) {
                const { contacts, isLatest } = events['contacts.set']
                console.log(`recv ${contacts.length} contacts (is latest: ${isLatest})`)
            }

            // received a new message
            if (events['messages.upsert']) {
                const upsert = events['messages.upsert']
                // console.log('recv messages ', JSON.stringify(upsert, undefined, 2))
                if (upsert.type === 'notify') {
                    for (const msg of upsert.messages) {
                        if (!msg.key.fromMe && doReplies) {
                            console.log('replying to', msg.key.remoteJid)
                            await conn.readMessages([msg.key])
                            await sendMessageWTyping({ text: 'Hello there!' }, msg.key.remoteJid)
                        }
                    }
                }
            }

            // messages updated like status delivered, message deleted etc.
            if (events['messages.update']) {
                console.log(events['messages.update'])
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

            if (events['chats.delete']) {
                console.log('chats deleted ', events['chats.delete'])
            }

        })
    return conn
}

connectToWhatsApp().catch(err => console.log(err))



