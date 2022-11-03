const { downloadMediaMessage } = require("@adiwajshing/baileys")
const { writeFile } = require('fs/promises')
const ffmpeg = require('fluent-ffmpeg');
const fs = require("fs");
const axios = require("axios");
let config = JSON.parse(fs.readFileSync('./config.json'))

const phoneNumberFormatter = function (number) {
    // 1. Menghilangkan karakter selain angka
    let formatted = number.replace(/\D/g, '');

    // 2. Menghilangkan angka 0 di depan (prefix)
    //    Kemudian diganti sesuai defaultCountryCode di config.json
    if (formatted.startsWith('0')) {
        formatted = config.defaultCountryCode + formatted.substr(1);
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
    await fs.writeFile(fName, attachment, { encoding: 'base64' }, function (err) {});
    return fName
}

const downloadMedia = async (msg) => {
    if(config.downloadMedia){
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
            if (!fs.existsSync('./downloaded_' + config.downloadFolder + '/')) {
                fs.mkdirSync('./downloaded_' + config.downloadFolder + '/');
            }
            let fileName = msg.key.remoteJid + '_' + msg.key.id + '_' + msg.message[messageType].mediaKeyTimestamp + '.' + ext
            await writeFile('./downloaded_' + config.downloadFolder + '/' + fileName, buffer)
            return `http://${config.appUrl}:${config.port}/downloaded_${config.downloadFolder}/${fileName}`
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

module.exports = {
    phoneNumberFormatter,
    fileSaver,
    downloadMedia,
    audioToOpus
}