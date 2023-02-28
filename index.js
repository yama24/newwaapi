"use strict";
const { default: makeWASocket, DisconnectReason, fetchLatestBaileysVersion, makeInMemoryStore, useMultiFileAuthState } = require("@adiwajshing/baileys")
const figlet = require("figlet");
const fs = require("fs");
const chalk = require('chalk')
const logg = require('pino')

const { exec } = require("child_process");

const express = require("express");
const http = require("http");
const { body, validationResult } = require("express-validator");
const fileUpload = require("express-fileupload");
const axios = require("axios");

// const { serialize } = require("./lib/myfunc");
const { phoneNumberFormatter, fileSaver, inArray } = require("./lib/helper");
const { replyer } = require("./lib/replyer");
const { color, mylog, infolog } = require("./lib/color");

let config = JSON.parse(fs.readFileSync('./config.json'));

const port = config.port;
const app = express();
const server = http.createServer(app);

let countTries = 0;
let maxTries = 3;

// const io = socketIO(server);

const restartCommand = process.argv[2] == 'pm2' ? 'pm2 restart newwaapi' : 'rs';

app.use(express.json());
app.use(
    express.urlencoded({
        extended: true,
    })
);
app.use(
    fileUpload({
        debug: false,
    })
);

let downloadedFolder = "/downloaded_" + config.downloadFolder
app.use(downloadedFolder, express.static(__dirname + downloadedFolder));

const useStore = !process.argv.includes('--no-store')

// judul console
function title() {
    console.clear()
    console.log()
    console.log(chalk.bold.green(figlet.textSync(' ' + config.name + ' ', {
        font: 'Pagga',
    })))
}

const store = useStore ? makeInMemoryStore({ logger: logg().child({ level: config.levelLog, stream: 'store' }) }) : undefined

store?.readFromFile('log_' + config.logFileName)

// save every 10s
setInterval(() => {
    store?.writeToFile('log_' + config.logFileName)
}, 10_000)

const connectToWhatsApp = async (notif = null, restart = false) => {

    // setInterval(() => {
    //     // axios.get(`http://${config.appUrl}:${port}/info`);
    //     // console.log('PING');
    //     if (config.notifTo.length > 0) {
    //         axios({
    //             method: 'post',
    //             url: `http://${config.appUrl}:${port}/is-registered`,
    //             data: {
    //                 number: `${config.notifTo}`
    //             }
    //         }).then((response) => {
    //             // console.log(response);
    //             console.log('PING');
    //         }, (error) => {
    //             // console.log(error);
    //             errChecker(error);
    //         });
    //     }
    // }, 15 * 60 * 1000)

    async function errChecker(err) {
        let nowTime = new Date();
        let consolelog, notifmsg, restart;
        switch (err?.output?.statusCode) {
            case 408:
            case 428:
                consolelog = chalk.bold.red(`RESTARTED ERROR : ${err?.output?.statusCode} @ ${nowTime} (${config.botName})`);
                notifmsg = `*RESTARTED ERROR* : ${err?.output?.statusCode} @ ${nowTime} *_(${config.botName})_*`;
                restart = true;
                break;
            case 515:
                consolelog = chalk.bold.green(`RESTARTED FIRST LOGIN : ${err?.output?.statusCode} @ ${nowTime} (${config.botName})`);
                notifmsg = null;
                restart = false;
                break;
            case 401:
                consolelog = chalk.bold.red(`LOGGED OUT`);
                notifmsg = null;
                restart = false;
                break;
            default:
                break;
        }
        console.log(consolelog);
        setTimeout(() => {
            connectToWhatsApp(notifmsg, restart);
        }, 5000);
    }

    const { state, saveCreds } = await useMultiFileAuthState('session_' + config.sessionName)
    // fetch latest version of WA Web
    const { version, isLatest } = await fetchLatestBaileysVersion()
    title()
    console.log(chalk.bold.green(`WhatsApp v${version.join('.')}, isLatest: ${isLatest}`))
    console.log(mylog(`App running on http://${config.appUrl}:${port}`));

    const conn = makeWASocket({
        printQRInTerminal: true,
        logger: logg({ level: config.levelLog }),
        auth: state,
        browser: [config.botName, "MacOS", "3.0"],
    })
    store.bind(conn.ev)

    conn.multi = true

    conn.ev.process(
        // events is a map for event name => event data
        async (events) => {
            // something about the connection changed
            // maybe it closed, or we received all offline message or connection opened
            if (events['connection.update']) {
                const update = events['connection.update']
                const { connection, lastDisconnect } = update
                if (connection === 'close') {
                    // const shouldReconnect = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut
                    // const shouldReconnect = inArray(lastDisconnect.error?.output?.statusCode, [408, 428])
                    // reconnect if not logged out

                    // STATUS_CODES
                    // 401: loggedOut
                    // 408: timedOut
                    // 411: multideviceMismatch
                    // 428: connectionClosed
                    // 440: connectionReplaced
                    // 500: badSession
                    // 515: restartRequired

                    if (inArray(lastDisconnect.error?.output?.statusCode, [408, 428])) {
                        await errChecker(lastDisconnect.error);
                    } else if (inArray(lastDisconnect.error?.output?.statusCode, [401])) {
                        console.log(mylog('WhatsApp disconnected...'))
                        fs.rmSync('session_' + config.sessionName, { recursive: true, force: true });
                        fs.rmSync('log_' + config.logFileName, { recursive: true, force: true });
                        await errChecker(lastDisconnect.error);
                    } else if (inArray(lastDisconnect.error?.output?.statusCode, [515])) {
                        console.log('Restarting...')
                        await errChecker(lastDisconnect.error);
                    }
                } else if (connection === 'open') {
                    console.log(mylog('Server Ready ✓'));
                    if (config.notifTo.length > 0) {
                        if (notif) {
                            await conn.sendMessage(phoneNumberFormatter(config.notifTo), { text: notif });
                        } else {
                            await conn.sendMessage(phoneNumberFormatter(config.notifTo), { text: `*${config.botName}* Ready ✓` });
                        }

                        if (restart) {
                            exec(restartCommand);
                        }
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
                console.log('recv messages ', JSON.stringify(upsert, undefined, 2))
                replyer({ conn, store, version, isLatest }, upsert)
            }

            // messages updated like status delivered, message deleted etc.
            if (events['messages.update']) {
                console.log('message update ', events['messages.update'])
            }

            if (events['message-receipt.update']) {
                console.log('message receipt update ', events['message-receipt.update'])
            }

            if (events['messages.reaction']) {
                console.log('message reaction ', events['messages.reaction'])
            }

            if (events['presence.update']) {
                console.log('presence update ', events['presence.update'])
            }

            if (events['chats.update']) {
                console.log('chat update ', events['chats.update'])
            }

            if (events['chats.delete']) {
                console.log('chats deleted ', events['chats.delete'])
            }

        })

    // app.get("/", (req, res) => {
    //     res.sendFile("/html/index.html", {
    //         root: __dirname,
    //     });
    // });

    app.get("/info", async (req, res) => {
        info: while (true) {
            try {
                
                res.status(200).json({
                    status: true,
                    response: conn.user,
                });
            } catch (err) {
                await errChecker(err);
                if (++countTries == maxTries) {
                    countTries = 0;
                    res.status(500).json({
                        status: false,
                        response: err,
                    });
                } else {
                    continue info;
                }
            }
        }
    });

    app.post("/send-message", [body("number").notEmpty(), body("message").notEmpty()], async (req, res) => {
        sendmessage: while (true) {
            try {
                const errors = validationResult(req).formatWith(({ msg }) => {
                    return msg;
                });

                if (!errors.isEmpty()) {
                    return res.status(422).json({
                        status: false,
                        response: errors.mapped(),
                    });
                }

                const number = phoneNumberFormatter(req.body.number);
                const message = req.body.message;

                const isRegisteredNumber = await conn.onWhatsApp(number);
                if (isRegisteredNumber.length == 0) {
                    return res.status(422).json({
                        status: false,
                        response: "The number is not registered",
                    });
                }

                const info = await conn.sendMessage(number, { text: message })
                res.status(200).json({
                    status: true,
                    response: info,
                });
                break;
            } catch (err) {
                await errChecker(err);
                if (++countTries == maxTries) {
                    countTries = 0;
                    res.status(500).json({
                        status: false,
                        response: err,
                    });
                } else {
                    continue sendmessage;
                }
            }
        }
    });

    app.post("/send-group-message", [body("id").notEmpty(), body("message").notEmpty(),], async (req, res) => {
        sendgroupmessage: while (true) {
            try {
                const errors = validationResult(req).formatWith(({ msg }) => {
                    return msg;
                });

                if (!errors.isEmpty()) {
                    return res.status(422).json({
                        status: false,
                        response: errors.mapped(),
                    });
                }

                let chatId = req.body.id;
                var message = req.body.message;

                const info = await conn.sendMessage(chatId, { text: message })
                res.status(200).json({
                    status: true,
                    response: info,
                });
            } catch (err) {
                await errChecker(err);
                if (++countTries == maxTries) {
                    countTries = 0;
                    res.status(500).json({
                        status: false,
                        response: err,
                    });
                } else {
                    continue sendgroupmessage;
                }
            }
        }
    });

    app.post("/send-media", [body("number").notEmpty(), body("file").notEmpty(),], async (req, res) => {
        sendmedia: while (true) {
            try {
                const num = req.body.number;
                const caption = req.body.caption;
                const fileUrl = req.body.file;
                const fileName = req.body.name;

                let number;
                if (num.includes("@g.us")) {
                    number = num;
                } else {
                    number = phoneNumberFormatter(num);
                    const isRegisteredNumber = await conn.onWhatsApp(number);
                    if (isRegisteredNumber.length == 0) {
                        return res.status(422).json({
                            status: false,
                            response: "The number is not registered",
                        });
                    }
                }

                let base64regex =
                    /^data:([a-zA-Z/]*);base64,([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

                let mimetype
                let attachment
                if (base64regex.test(fileUrl)) {
                    let array = fileUrl.split(";base64,");
                    attachment = array[1];
                    mimetype = array[0].replace("data:", "");
                } else {
                    attachment = await axios
                        .get(fileUrl, {
                            responseType: "arraybuffer",
                        })
                        .then((response) => {
                            mimetype = response.headers["content-type"];
                            return response.data.toString("base64");
                        });
                }

                mimetype = mimetype.split(';')[0]
                let file = await fileSaver(mimetype, attachment, fileName)
                let typeFile
                switch (mimetype.split('/')[0]) {
                    case 'image':
                    case 'video':
                    case 'audio':
                        typeFile = mimetype.split('/')[0]
                        break;
                    default:
                        typeFile = 'document'
                        break;
                }

                let messageMedia = {
                    caption: caption,
                    [typeFile]: {
                        url: file,
                    },
                    fileName: fileName,
                    gifPlayback: false
                }

                const info = await conn.sendMessage(number, messageMedia)
                res.status(200).json({
                    status: true,
                    response: info,
                });
            } catch (err) {
                await errChecker(err);
                if (++countTries == maxTries) {
                    countTries = 0;
                    res.status(500).json({
                        status: false,
                        response: err,
                    });
                } else {
                    continue sendmedia;
                }
            }
        }
    });

    app.post("/is-registered", [body("number").notEmpty()], async (req, res) => {
        isregistered: while (true) {
            try {
                const errors = validationResult(req).formatWith(({ msg }) => {
                    return msg;
                });

                if (!errors.isEmpty()) {
                    return res.status(422).json({
                        status: false,
                        response: errors.mapped(),
                    });
                }

                const number = phoneNumberFormatter(req.body.number);

                const isRegisteredNumber = await conn.onWhatsApp(number);
                if (isRegisteredNumber.length > 0) {
                    res.status(200).json({
                        status: true,
                        response: 'registered',
                    });
                } else {
                    res.status(200).json({
                        status: false,
                        response: 'not registered',
                    });
                }
            } catch (err) {
                await errChecker(err);
                if (++countTries == maxTries) {
                    countTries = 0;
                    res.status(500).json({
                        status: false,
                        response: err,
                    });
                } else {
                    continue isregistered;
                }
            }
        }
    });

    app.get("/get-groups", async (req, res) => {
        getgroups: while (true) {
            try {
                let groups = [];
                let i = 0;
                for (const s in store.chats.dict) {
                    if (s.endsWith('@g.us')) {
                        groups[i] = {
                            id: s,
                            name: store.chats.dict[s].name
                        };
                        i++;
                    }
                }
                res.status(200).json({
                    status: true,
                    response: groups,
                });
            } catch (err) {
                await errChecker(err);
                if (++countTries == maxTries) {
                    countTries = 0;
                    res.status(500).json({
                        status: false,
                        response: err,
                    });
                } else {
                    continue getgroups;
                }
            }
        }
    });

    app.get("/get-config", async (req, res) => {
        getconfig: while (true) {
            try {
                res.status(200).json({
                    status: true,
                    response: config,
                });
            } catch (err) {
                await errChecker(err);
                if (++countTries == maxTries) {
                    countTries = 0;
                    res.status(500).json({
                        status: false,
                        response: err,
                    });
                } else {
                    continue getconfig;
                }
            }
        }
    });

    return conn
}

connectToWhatsApp().catch(err => console.log(err))

server.listen(port, function () {
    console.log(`App running on http://${config.appUrl}:${port}`);
});
