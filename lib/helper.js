const { downloadMediaMessage } = require("@adiwajshing/baileys")
const { writeFile } = require('fs/promises')
const execSync = require('child_process').execSync;
const ffmpeg = require('fluent-ffmpeg');
const fs = require("fs");
const axios = require("axios");
let cfg = JSON.parse(fs.readFileSync('./config.json'))

const phoneNumberFormatter = function (number) {
    // 1. Menghilangkan karakter selain angka
    let formatted = number.replace(/\D/g, '');

    // 2. Menghilangkan angka 0 di depan (prefix)
    //    Kemudian diganti sesuai defaultCountryCode di config.json
    if (formatted.startsWith('0')) {
        formatted = cfg.defaultCountryCode + formatted.substr(1);
    }

    if (!formatted.endsWith('@s.whatsapp.net')) {
        formatted += '@s.whatsapp.net';
    }

    return formatted;
}

const fileSaver = async (mimetype, attachment, fileName = null) => {
    let folder = "./TEMP/"
    if (fs.existsSync(folder)) {
        await fs.rmSync(folder, { recursive: true, force: true });
    }
    let fName = folder + (fileName ? fileName : mimetype.replace('/', '.'))
    if (!fs.existsSync(folder)) {
        await fs.mkdirSync(folder);
    }
    await fs.writeFile(fName, attachment, { encoding: 'base64' }, function (err) { });
    return fName
}

const downloadMedia = async (msg) => {
    if (cfg.downloadMedia) {
        let messageType = Object.keys(msg.message)[0] ?? false   // get what type of message it is -- text, image, video
        // if the message is an image
        switch (messageType) {
            case 'imageMessage':
            case 'videoMessage':
            case 'audioMessage':
            case 'stickerMessage':
            case 'documentMessage':
                let ext = msg.message[messageType].mimetype.split('/')[1].split(';')[0]
                // download the message
                const buffer = await downloadMediaMessage(msg, 'buffer', {})
                // save to file
                if (!fs.existsSync('./downloaded_' + cfg.downloadFolder + '/')) {
                    fs.mkdirSync('./downloaded_' + cfg.downloadFolder + '/');
                }
                let fileName = msg.key.remoteJid + '_' + msg.key.id + '_' + msg.message[messageType].mediaKeyTimestamp + '.' + ext
                await writeFile('./downloaded_' + cfg.downloadFolder + '/' + fileName, buffer)
                return `http://${cfg.appUrl}:${cfg.port}/downloaded_${cfg.downloadFolder}/${fileName}`
                break;
            default:
                return false
                break;
        }
    } else {
        return false
    }
}

const audioToOpus = async (url) => { //FIX THIS!!!

    let mimetype
    attachment = await axios
        .get(url, {
            responseType: "arraybuffer",
        })
        .then((response) => {
            mimetype = response.headers["content-type"];
            return response.data.toString("base64");
        });

    let fileName = await fileSaver(mimetype, attachment)
    const final_path = "." + fileName.split('.')[1] + '.opus'

    await ffmpeg(fs.createReadStream(fileName))
        .output(final_path)
        .audioCodec('libopus')
        .run();
    return final_path
}

const validURL = async (str) => {
    var pattern = new RegExp(
        "^(https?:\\/\\/)?" + // protocol
        "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
        "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
        "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
        "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
        "(\\#[-a-z\\d_]*)?$",
        "i"
    ); // fragment locator
    return !!pattern.test(str);
}

const sendCallback = function (message) {
    if (cfg.webhook) {
        var data = JSON.stringify(message);
        var config = {
            method: "POST",
            url: cfg.webhook,
            headers: {
                "Content-Type": "application/json",
            },
            data: data,
        };
        axios(config)
            .then(function (response) {
                console.log("callback sent")
            })
            .catch(function (error) {
                console.log(error);
            });
    } else {
        console.log("No webhook url in config.json file");
    }
}

const inArray = function (needle, haystack) {
    var length = haystack.length;
    for (var i = 0; i < length; i++) {
        if (haystack[i] == needle) return true;
    }
    return false;
}

const commander = function (commander, command) {
    if (cfg.commander.includes(commander)) {
        try {
            var status = execSync(command, { encoding: 'utf-8' });
        } catch (e) {
            console.log(e);
            var status = false;
        }
        return status;
    } else {
        return false;
    }
}

module.exports = {
    phoneNumberFormatter,
    fileSaver,
    downloadMedia,
    audioToOpus,
    validURL,
    sendCallback,
    inArray,
    commander
}