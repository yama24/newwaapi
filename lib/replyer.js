// const chalk = require('chalk')

// const color = (text, color) => {
//     return !color ? chalk.green(text) : chalk.keyword(color)(text)
// }

// const bgcolor = (text, bgcolor) => {
// 	return !bgcolor ? chalk.green(text) : chalk.bgKeyword(bgcolor)(text)
// }

// const mylog = (text, color) => {
// 	return !color ? chalk.greenBright('[ WHATSAPP BOT ] ') + chalk.magentaBright(text) : chalk.greenBright('[ WHATSAPP BOT ] ') + chalk.keyword(color)(text)
// }

// const infolog = (text) => {
// 	return chalk.greenBright('[ WHATSAPP BOT ] ') + chalk.magentaBright(text)
// }
const { delay } = require("@adiwajshing/baileys")

const doReplies = !process.argv.includes('--no-reply')



const sendMessageWTyping = async (conn, text, msg, isReply = null) => {
    await conn.presenceSubscribe(msg.key.remoteJid)
    await delay(500)

    await conn.sendPresenceUpdate('composing', msg.key.remoteJid)
    await delay(2000)

    await conn.sendPresenceUpdate('paused', msg.key.remoteJid)

    if (isReply) {
        await conn.sendMessage(msg.key.remoteJid, { text }, { quoted: msg })
    } else {
        await conn.sendMessage(msg.key.remoteJid, { text })
    }
}

const replyer = (conn, msg) => {
    if (!msg.key.fromMe && doReplies) {
        console.log('replying to', msg.key.remoteJid)
        conn.readMessages([msg.key])

        const message = msg.message.conversation

        // const { type, quotedMsg, mentioned, now, fromMe } = msg

        // const chats = (type === 'conversation' && msg.message.conversation) ? msg.message.conversation : (type == 'imageMessage') && msg.message.imageMessage.caption ? msg.message.imageMessage.caption : (type == 'documentMessage') && msg.message.documentMessage.caption ? msg.message.documentMessage.caption : (type == 'videoMessage') && msg.message.videoMessage.caption ? msg.message.videoMessage.caption : (type == 'extendedTextMessage') && msg.message.extendedTextMessage.text ? msg.message.extendedTextMessage.text : (type == 'buttonsResponseMessage' && msg.message.buttonsResponseMessage.selectedButtonId) ? msg.message.buttonsResponseMessage.selectedButtonId : (type == 'templateButtonReplyMessage') && msg.message.templateButtonReplyMessage.selectedId ? msg.message.templateButtonReplyMessage.selectedId : ''
        // const prefix = /^[°•π÷×¶∆£¢€¥®™✓_=|~!?#$%^&.+-,\/\\©^]/.test(chats) ? chats.match(/^[°•π÷×¶∆£¢€¥®™✓_=|~!?#$%^&.+-,\/\\©^]/gi) : '#'

        switch (message) {
            case '!ping':
                var text = "pong"
                var isReply = true
                break;
            case '!info':
                var text = `
                *Connection info*
                User name: ${conn.user.name}
                My number: ${conn.user.id.split(":")[0]}
                Platform: ${conn.authState.creds.platform}
                `
                var isReply = true
                break;
            case '!buttons':
                const button = [
                    { urlButton: { displayText: `My Website!`, url: `https://humanoo.id/yama/` } },
                    { quickReplyButton: { displayText: `💰 Donasi`, id: `!donate` } }
                ]

                // const templateMessageImage = {
                //     caption: "caption",
                //     image: {
                //         url: "https://images.unsplash.com/photo-1660228652863-891f27cbe45c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=435&q=80"
                //     },
                //     templateButtons: button,
                //     footer: 'footer'
                // }

                const templateMessage = {
                    text: "Hi it's a template message",
                    footer: 'Hello World',
                    templateButtons: button
                }


                conn.sendMessage(msg.key.remoteJid, templateMessage)
                var text = "That's is the button!"
                var isReply = true
                break;
            case '!lists':
                const sections = [
                    {
                        title: "Section 1",
                        rows: [
                            { title: "Option 1", rowId: "option1" },
                            { title: "Option 2", rowId: "option2", description: "This is a description" }
                        ]
                    },
                    {
                        title: "Section 2",
                        rows: [
                            { title: "Option 3", rowId: "option3" },
                            { title: "Option 4", rowId: "option4", description: "This is a description V2" }
                        ]
                    },
                ]

                const listMessage = {
                    text: "This is a list",
                    footer: "nice footer, link: https://google.com",
                    title: "Amazing boldfaced list title",
                    buttonText: "Required, text on the button to view the list",
                    sections
                }
                conn.sendMessage(msg.key.remoteJid, listMessage)
                var text = "That's is the lists!"
                var isReply = true

                break;
            case '!react':
                const reactionMessage = {
                    react: {
                        text: "💖", // use an empty string to remove the reaction
                        key: msg.key
                    }
                }
                conn.sendMessage(msg.key.remoteJid, reactionMessage)

                var text = "That's is the reaction!"
                var isReply = true
                break;
            case '!contact':
                const vcard = 'BEGIN:VCARD\n' // metadata of the contact card
                    + 'VERSION:3.0\n'
                    + 'FN:Just Test\n' // full name
                    + 'ORG:This Is Organization;\n' // the organization of the contact
                    + 'TEL;type=CELL;type=VOICE;waid=6289861821283:+62 898618 21283\n' // WhatsApp ID + phone number
                    + 'END:VCARD'
                const contact = {
                    contacts: {
                        displayName: 'Jeff',
                        contacts: [{ vcard }]
                    }
                }
                conn.sendMessage(msg.key.remoteJid, contact)
                var text = "That's is the contact!"
                var isReply = true
                break;
            default:
                if (message.startsWith("!sendto ")) {
                    var number = message.split(" ")[1];

                    var text = `Message sent to ${number}`

                    var messageIndex = message.indexOf(number) + number.length;
                    var messageBody = message.slice(messageIndex, message.length);
                    number = number.includes("@s.whatsapp.net") ? number : `${number}@s.whatsapp.net`;
                    conn.sendMessage(number, { text: messageBody })

                    var isReply = true
                } else {
                    var text = "Hello there!"
                    var isReply = true
                }
                break;
        }
        sendMessageWTyping(conn, text, msg, isReply)
    }
}

module.exports = {
    replyer, sendMessageWTyping
}
