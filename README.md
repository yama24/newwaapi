# mywaapi
newwaapi is an alternative mywaapi but using Baileys and yeah, it's Unofficial WhatsApp API made by me on NodeJs

![Logo](https://static.whatsapp.net/rsrc.php/v3/yO/r/FsWUqRoOsPu.png)

## Thanks for :
 - [@whiskeysockets/baileys](https://github.com/whiskeysockets/baileys)
 - [@adiwajshing/keyed-db](https://github.com/adiwajshing/keyed-db)
 - [@hapi/boom](https://github.com/hapijs/hapi)
 - [chalk](https://github.com/chalk/chalk)
 - [nodemon](https://github.com/remy/nodemon)
 - [qrcode-terminal](https://github.com/gtanner/qrcode-terminal)
 - [figlet](https://github.com/patorjk/figlet.js)
 - [jimp](https://github.com/oliver-moran/jimp)
 - [link-preview-js](https://github.com/ospfranco/link-preview-js)
 - [node-fetch](https://github.com/node-fetch/node-fetch)
 - [pino](https://github.com/pinojs/pino)
 - [pm2](https://github.com/Unitech/pm2)



## Installation
I'm always run this project using NodeJs version 16, so use NodeJs version 16 for better experience

Clone the project

```bash
  git clone https://github.com/yama24/newwaapi.git
```

or you can download the stable version from [Here](https://github.com/yama24/newwaapi/releases).

Go to the project directory

```bash
  cd newwaapi
```

Install dependencies

```bash
  yarn install
```

Create config file from example and edit it as you want

```bash
  cp config.json.example config.json
```

To login/scan the QR code, run the command :

```bash
  yarn start:dev
```
then scan qrCode from terminal. And when the bot is logged in, you can stop the bot and run the command :

```bash
  yarn start
```
for production mode

List of scripts in [package.json](https://github.com/yama24/newwaapi/blob/main/package.json) file

```json
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "start": "pm2 start index.js --name newwaapi -- pm2",
    "start:dev": "nodemon index.js nodemon",
    "restart": "pm2 restart newwaapi",
    "stop": "pm2 stop newwaapi",
    "status": "pm2 show newwaapi",
    "kill": "pm2 delete newwaapi",
    "logs": "pm2 logs newwaapi --lines 1000"
  }
```


## API Reference

#### Send message to contact

```http
  POST /send-message
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `number` | `string` | **Required**. destination number |
| `message` | `string` | **Required**. message you want to send |

#### Bot info

```http
  GET /info
```

#### Config list

```http
  GET /get-config
```

#### Check is the number registered

```http
  POST /is-registered
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `number` | `string` | **Required**. target number |


#### Send media to contact/group

```http
  POST /send-media
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `number` | `string` | **Required**. destination number/group id |
| `file` | `string` | **Required**. url or base64 url data |
| `caption` | `string` | file captions |
| `name` | `string` | file name (work for document file) |

#### Send message to group

```http
  POST /send-group-message
```

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `id` | `string` | **Required**. destination number (6289861821283-1627374981@g.us) |
| `message` | `string` | **Required**. message you want to send |

The group id can be obtained by sending a !groups message to the bot. then the bot will send all group data in which there are bots and you.

#### Get list of groups

```http
  GET /get-groups
```

## Newwaapi Library
if you want it to be simpler and easier, use the following library to integrate newwaapi into your system
 - [Newwaapi PHP Lib](https://packagist.org/packages/yama/newwaapi-php-lib) (use the latest version for better experience)


## 🚀 About Me
I am Yayan Maulana, Web Developer from Bogor, Indonesia. I have a lot of experience in building web-based application systems like ERP, CRM. E-Commerce, etc. I am also a fast learner. Everything can be learned except for something I don't want to learn. Give me space, time and internet access so I can be anything.


[![linkedin](https://img.shields.io/badge/linkedin-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/abuyama/)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/abuyama)
