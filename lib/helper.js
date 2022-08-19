const { downloadMediaMessage } = require("@adiwajshing/baileys")
const { writeFile } = require('fs/promises')
const fs = require("fs");
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

const fileSaver = function (mimetype, attachment, fileName) {
    let folder = "./TEMP/"
    if (fs.existsSync(folder)) {
        fs.rmSync(folder, { recursive: true, force: true });
    }
    let fName = folder + (fileName ? fileName : mimetype.replace('/', '.'))
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
    }
    fs.writeFile(fName, attachment, { encoding: 'base64' }, function (err) {
        // console.log('File created');
    });
    return fName
}

const downloadMedia = async (msg) => {
    let messageType = Object.keys(msg.message)[0]// get what type of message it is -- text, image, video
    // if the message is an image
    switch (messageType) {
        case 'imageMessage':
        case 'videoMessage':
        case 'audioMessage':
        case 'stickerMessage':
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
}

module.exports = {
    phoneNumberFormatter,
    fileSaver,
    downloadMedia
}