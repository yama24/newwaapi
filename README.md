# mywaapi
newwaapi is an alternative mywaapi but using Baileys and yeah, it's Unofficial WhatsApp API made by me on NodeJs

![Logo](https://static.whatsapp.net/rsrc.php/v3/yO/r/FsWUqRoOsPu.png)

## Thanks for :
 - [@adiwajshing/baileys](https://github.com/adiwajshing/Baileys)
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

Start the server

```bash
  yarn start
```

and for the Dev mode

```bash
  yarn start:dev
```

then scan qrCode from terminal

Notes : 
- If you want to use template message (like button, lists, etc), remove comment in node_modules/@adiwajshing/baileys/lib/Utils/message.js at line 613.

from 

```javascript
  // || message.templateMessage
```

to

```javascript
  || message.templateMessage
```

- this method only applies to @adiwajshing/baileys version 4.4.0


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
| `numberOrGroupId` | `string` | **Required**. destination number/group id |
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
 - [PHP use Composer](https://packagist.org/packages/yama/newwaapi-php-lib)


## 🚀 About Me
I am Yayan Maulana, Web Developer from Bogor, Indonesia. I have a lot of experience in building web-based application systems like ERP, CRM. E-Commerce, etc. I am also a fast learner. Everything can be learned except for something I don't want to learn. Give me space, time and internet access so I can be anything.


[![portfolio](https://img.shields.io/badge/my_portfolio-000?style=for-the-badge&logo=ko-fi&logoColor=white)](https://humanoo.id/yama)
[![linkedin](https://img.shields.io/badge/linkedin-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/yayan-maulana-836883212/)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/abuyama)
