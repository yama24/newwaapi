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

module.exports = {
    phoneNumberFormatter
}