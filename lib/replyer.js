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

const replyer = (data, upsert) => {
    let conn = data.conn
    let store = data.store
    let version = data.version
    let isLatest = data.isLatest
    for (const msg of upsert.messages) {
        if (!msg.key.fromMe && doReplies) {
            // const message = msg.message.conversation

            const { type, quotedMsg, mentioned, now, fromMe } = upsert
            if (type == 'conversation' || type == 'notify') {
                if (msg.message.conversation) {
                    var message = msg.message.conversation
                } else if (msg.message.templateButtonReplyMessage) {
                    var message = msg.message.templateButtonReplyMessage.selectedId
                }
            } else if (type == 'imageMessage' && msg.message.imageMessage.caption) {
                var message = msg.message.imageMessage.caption
            } else if (type == 'documentMessage' && msg.message.documentMessage.caption) {
                var message = msg.message.documentMessage.caption
            } else if (type == 'videoMessage' && msg.message.videoMessage.caption) {
                var message = msg.message.videoMessage.caption
            } else if (type == 'extendedTextMessage' && msg.message.extendedTextMessage.text) {
                var message = msg.message.extendedTextMessage.text
            } else if (type == 'buttonsResponseMessage' && msg.message.buttonsResponseMessage.selectedButtonId) {
                var message = msg.message.buttonsResponseMessage.selectedButtonId
            } else if (type == 'templateButtonReplyMessage' && msg.message.templateButtonReplyMessage.selectedId) {
                var message = msg.message.templateButtonReplyMessage.selectedId
            } else {
                var message = ''
            }

            const prefix = /^[°•π÷×¶∆£¢€¥®™✓_=|~!?#$%^&.+-,\/\\©^]/.test(message) ? message.match(/^[°•π÷×¶∆£¢€¥®™✓_=|~!?#$%^&.+-,\/\\©^]/gi) : '#'

            switch (message) {
                case prefix + 'ping':
                    var text = "pong"
                    var isReply = true
                    var reply = true
                    break;
                case prefix + 'info':
                    var text = `*Connection info*
User name: ${conn.user.name}
My number: ${conn.user.id.split(":")[0]}
Platform: ${conn.authState.creds.platform}`
                    var isReply = true
                    var reply = true
                    break;
                case prefix + 'groups':
                    var text = "*YOUR GROUPS*\n\n";
                    for (const s in store.chats.dict) {
                        if (s.endsWith('@g.us')) {
                            text += `ID: ${s}\nName: ${store.chats.dict[s].name}\n\n`;
                        }
                    }
                    text +=
                        "_You can use the group id to send a message to the group._";
                    var isReply = true
                    var reply = true
                    break;
                case prefix + 'version':
                    var text = `*WhatsApp :* v${version.join('.')}, *isLatest :* ${isLatest}`;
                    var isReply = true
                    var reply = true
                    break;


                case prefix + 'mention':
                    conn.sendMessage(msg.key.remoteJid, { text: `@${msg.key.remoteJid.split('@')[0]}`, mentions: [msg.key.remoteJid] })
                    var text = `That's the mention!`
                    var isReply = true
                    var reply = true
                    break;
                case prefix + 'buttons':
                case prefix + 'button':
                    const button = [
                        { urlButton: { displayText: `My Website!`, url: `https://github.com/yama24/newwaapi` } },
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
                    var text = "That's the Buttons!"
                    var isReply = true
                    var reply = true
                    break;
                case prefix + 'lists':
                case prefix + 'list':
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
                    var text = "That's the lists!"
                    var isReply = true
                    var reply = true
                    break;
                case prefix + 'react':
                    const reactionMessage = {
                        react: {
                            text: "💖", // use an empty string to remove the reaction
                            key: msg.key
                        }
                    }
                    conn.sendMessage(msg.key.remoteJid, reactionMessage)

                    var text = "That's the reaction!"
                    var isReply = true
                    var reply = true
                    break;
                case prefix + 'contact':
                    const vcard = 'BEGIN:VCARD\n' // metadata of the contact card
                        + 'VERSION:3.0\n'
                        + 'FN:Just Test\n' // full name
                        + 'ORG:This Is Organization;\n' // the organization of the contact
                        + 'TEL;type=CELL;type=VOICE;waid=6289861821283:+62 898618 21283\n' // WhatsApp ID + phone number
                        + 'END:VCARD'
                    const contact = {
                        contacts: {
                            // displayName: 'Jeff',
                            contacts: [{ vcard }]
                        }
                    }
                    conn.sendMessage(msg.key.remoteJid, contact)
                    var text = "That's the contact!"
                    var isReply = true
                    var reply = true
                    break;
                case prefix + 'location':
                    const location = {
                        location: {
                            degreesLatitude: 24.121231,
                            degreesLongitude: 55.1121221
                        }
                    }
                    conn.sendMessage(msg.key.remoteJid, location)
                    var text = "That's the location!"
                    var isReply = true
                    var reply = true
                    break;
                case prefix + 'link':
                case prefix + 'url':
                    conn.sendMessage(msg.key.remoteJid, { text: 'Hi, this was sent using https://github.com/yama24/newwaapi' })
                    var reply = false
                    break;
                case prefix + 'image':
                case prefix + 'picture':
                    var messageImage = {
                        caption: "here's the image",
                        image: {
                            url: "https://images.unsplash.com/photo-1660228652863-891f27cbe45c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=435&q=80"
                        }
                    }

                    conn.sendMessage(msg.key.remoteJid, messageImage)
                    var reply = false
                    break;
                case prefix + 'video':
                    var messageVideo = {
                        video: {
                            url: "https://cdn.videvo.net/videvo_files/video/premium/video0037/large_watermarked/docklands_clocks00_preview.mp4"
                        },
                        caption: "here's the video!",
                        gifPlayback: false
                    }

                    conn.sendMessage(msg.key.remoteJid, messageVideo)
                    var reply = false
                    break;
                case prefix + 'gif':
                    var messageGif = {
                        video: {
                            url: "https://cdn.videvo.net/videvo_files/video/premium/video0047/large_watermarked/360_360-0960_preview.mp4"
                        },
                        caption: "here's the gif!",
                        gifPlayback: true
                    }

                    conn.sendMessage(msg.key.remoteJid, messageGif)
                    var reply = false
                    break;
                case prefix + 'audio':
                    var messageGif = {
                        audio: {
                            url: "https://www.zapsplat.com/wp-content/uploads/2015/sound-effects-14566/zapsplat_animals_bats_flying_foxes_in_trees_evening_mary_caincross_reserve_australia_001_17614.mp3"
                        },
                        // mimetype: 'audio/mp4'
                    }

                    conn.sendMessage(msg.key.remoteJid, messageGif)
                    var reply = false
                    break;
                case prefix + 'help':
                case prefix + 'menu':
                    var templateButtons = [
                        { quickReplyButton: { displayText: `🔔 Ping`, id: `#ping` } },
                        { quickReplyButton: { displayText: `❔ Info`, id: `#info` } },
                        { quickReplyButton: { displayText: `👥 Groups`, id: `#groups` } },
                        { quickReplyButton: { displayText: `💡 Version`, id: `#version` } },
                        { quickReplyButton: { displayText: `✅ Example`, id: `#example` } }
                    ]

                    var messageButton = {
                        text: "*Bot Command Lists*",
                        footer: 'touch the button below to see the magic!',
                        templateButtons: templateButtons
                    }
                    conn.sendMessage(msg.key.remoteJid, messageButton)
                    var reply = false
                    break;
                case prefix + 'example':
                    var templateButtons = [
                        { quickReplyButton: { displayText: `⌨️ Button`, id: `#buttons` } },
                        { quickReplyButton: { displayText: `📄 List`, id: `#lists` } },
                        { quickReplyButton: { displayText: `❗️ Mention`, id: `#mention` } },
                        { quickReplyButton: { displayText: `💖 React`, id: `#react` } },
                        { quickReplyButton: { displayText: `👤 Contact`, id: `#contact` } },
                        { quickReplyButton: { displayText: `📌 Location`, id: `#location` } },
                        { quickReplyButton: { displayText: `🌐 Link`, id: `#link` } },
                        { quickReplyButton: { displayText: `📸 Image`, id: `#image` } },
                        { quickReplyButton: { displayText: `🎥 Video`, id: `#video` } },
                        { quickReplyButton: { displayText: `🖼 Gif`, id: `#gif` } },
                        { quickReplyButton: { displayText: `🎙 Audio`, id: `#audio` } },
                    ]

                    var messageButton = {
                        text: "*Example Message Lists*",
                        footer: "it's just an example, what do you expect?",
                        templateButtons: templateButtons
                    }
                    conn.sendMessage(msg.key.remoteJid, messageButton)
                    var reply = false
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
                        var reply = true
                    } else {
                        var reply = false
                    }
                    break;
            }
            if (reply) {
                console.log('replying to', msg.key.remoteJid)
                conn.readMessages([msg.key])
                sendMessageWTyping(conn, text, msg, isReply)
            }
        }
    }
}

module.exports = {
    replyer, sendMessageWTyping
}