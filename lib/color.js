const chalk = require('chalk')
const fs = require("fs");
let setting = JSON.parse(fs.readFileSync('./config.json'));

const color = (text, color) => {
	return !color ? chalk.green(text) : chalk.keyword(color)(text)
}

const bgcolor = (text, bgcolor) => {
	return !bgcolor ? chalk.green(text) : chalk.bgKeyword(bgcolor)(text)
}

const mylog = (text, color) => {
	return !color ? chalk.greenBright(`[ ${setting.botName} ] `) + chalk.magentaBright(text) : chalk.greenBright(`[ ${setting.botName} ] `) + chalk.keyword(color)(text)
}

const infolog = (text) => {
	return chalk.greenBright(`[ ${setting.botName} ] `) + chalk.magentaBright(text)
}

module.exports = {
	color,
	bgcolor,
	mylog,
	infolog
}
