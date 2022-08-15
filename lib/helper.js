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

module.exports = {
    phoneNumberFormatter,
    fileSaver
}