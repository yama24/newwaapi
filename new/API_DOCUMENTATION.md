# WhatsApp REST API Documentation

## Overview
This is a REST API for sending WhatsApp messages using Baileys library with configurable settings.

## Requirements

- **Node.js**: Version 20 or higher (tested with Node.js 22.14.0)
- **npm**: Latest stable version
- **Docker** (optional): For containerized deployment

## Docker Deployment

### Quick Start
```bash
# Clone repository
git clone <repository-url>
cd newwaapi

# Setup configuration
cp config.json.example config.json
# Edit config.json with your settings

# Run with Docker Compose
docker-compose up -d
```

### Docker Features
- **Base Image**: Node.js 20 Alpine (minimal size)
- **Health Checks**: Container health monitoring
- **Persistent Data**: Session and logs preserved
- **Environment Configuration**: Via .env file

## PM2 Process Management

### Quick Start with PM2
```bash
# Setup PM2 environment
./pm2.sh setup

# Start in production mode
./pm2.sh start

# Monitor application
./pm2.sh status
```

### PM2 Features
- **Process Management**: Automatic restarts and clustering
- **Zero Downtime**: Graceful reloads
- **Monitoring**: Built-in dashboard and logging
- **Production Ready**: Startup scripts and memory management

## Configuration

### Setup Configuration
1. Copy `config.json.example` to `config.json`
2. Edit `config.json` with your settings:

```json
{
  "name": "New WhatsApp API",
  "botName": "WA API Bot",
  "sessionName": "newsession",
  "levelLog": "error",
  "logFileName": "wa-logs.json",
  "appUrl": "localhost",
  "port": 3000,
  "defaultCountryCode": 62,
  "username": "yourusername",
  "password": "yourpassword",
  "authRequired": false,
  "pairing": {
    "usePairingCode": true,
    "phoneNumber": ""
  },
  "features": {
    "autoReply": false,
    "readMessages": true,
    "typing": true
  },
  "timezone": "Asia/Jakarta"
}
```

### Configuration Options

- **name**: Application name
- **botName**: Bot display name
- **sessionName**: Session folder name (will create `session_newsession` folder)
- **levelLog**: Log level (`trace`, `debug`, `info`, `warn`, `error`, `fatal`)
- **logFileName**: Log file name
- **appUrl**: Server URL
- **port**: Server port
- **defaultCountryCode**: Default country code for phone numbers (62 for Indonesia)
- **authRequired**: Enable/disable API authentication
- **username/password**: Basic Auth credentials (if authRequired is true)
- **pairing.usePairingCode**: Use pairing code instead of QR
- **pairing.phoneNumber**: Pre-set phone number for pairing
- **features.autoReply**: Enable auto-reply to messages
- **features.readMessages**: Mark messages as read
- **features.typing**: Show typing indicator before sending

## Getting Started

### Installation
```bash
npm install
```

### Starting the Server
```bash
npm start
```

The server will run on the configured port (default: 3000)

## Authentication

If `authRequired` is set to `true` in config, all API endpoints require Basic Authentication:

```bash
curl -X GET http://localhost:3000/info \
  -u "yourusername:yourpassword"
```

Or with Authorization header:
```bash
curl -X GET http://localhost:3000/info \
  -H "Authorization: Basic $(echo -n 'yourusername:yourpassword' | base64)"
```

## API Endpoints

### 1. Get Bot Information
- **URL:** `GET /info`
- **Description:** Get information about the connected WhatsApp account
- **Response:**
```json
{
  "status": true,
  "response": {
    "id": "628986182128:37@s.whatsapp.net",
    "name": "Your Name"
  }
}
```

### 2. Send Message to Individual or Group
- **URL:** `POST /send-message`
- **Description:** Send a text message to an individual WhatsApp number or group
- **Body Parameters:**
  - `number` (required): Phone number with country code (e.g., "628123456789") OR group ID (e.g., "628986182128-1627374981@g.us")
  - `message` (required): Text message to send

**Example Request (Individual):**
```bash
curl -X POST http://localhost:3000/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "number": "628123456789",
    "message": "Hello from API!"
  }'
```

**Example Request (Group):**
```bash
curl -X POST http://localhost:3000/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "number": "628986182128-1627374981@g.us",
    "message": "Hello group from API!"
  }'
```

**Response:**
```json
{
  "status": true,
  "response": {
    "key": {
      "remoteJid": "628123456789@s.whatsapp.net",
      "fromMe": true,
      "id": "MESSAGE_ID"
    },
    "message": {...},
    "messageTimestamp": 1234567890,
    "status": 1
  }
}
```

### 3. Send Message to Group (Legacy)
- **URL:** `POST /send-group-message`
- **Description:** Send a text message to a WhatsApp group (legacy endpoint, use `/send-message` instead)
- **Body Parameters:**
  - `id` (required): Group ID (e.g., "120363123456789@g.us")
  - `message` (required): Text message to send

**Example Request:**
```bash
curl -X POST http://localhost:3000/send-group-message \
  -H "Content-Type: application/json" \
  -d '{
    "id": "120363123456789@g.us",
    "message": "Hello group!"
  }'
```

### 4. Check if Number is Registered
- **URL:** `POST /check-number`
- **Description:** Check if a phone number is registered on WhatsApp
- **Body Parameters:**
  - `number` (required): Phone number with country code

**Example Request:**
```bash
curl -X POST http://localhost:3000/check-number \
  -H "Content-Type: application/json" \
  -d '{
    "number": "628123456789"
  }'
```

**Response:**
```json
{
  "status": true,
  "response": {
    "number": "628123456789@s.whatsapp.net",
    "isRegistered": true
  }
}
```

### 5. Send Media Files
- **URL:** `POST /send-media`
- **Description:** Send media files (images, videos, audio, documents) to WhatsApp individual or group
- **Content-Type:** `multipart/form-data` for file upload or `application/json` for base64/URL
- **Body Parameters:**
  - `number` (required): Phone number with country code OR group ID (e.g., `628986182128-1627374981@g.us`)
  - `caption` (optional): Caption for the media
  - `file` (required): Media file in one of these formats:
    - **File Upload**: Upload file directly
    - **Base64 Data URL**: `data:mime/type;base64,BASE64_DATA`
    - **Plain Base64**: Base64 string + `mimeType` parameter
    - **URL**: HTTP/HTTPS URL to download

**Example - File Upload to Individual:**
```bash
curl -X POST http://localhost:3000/send-media \
  -F "number=628123456789" \
  -F "caption=Check this out!" \
  -F "file=@/path/to/image.jpg"
```

**Example - File Upload to Group:**
```bash
curl -X POST http://localhost:3000/send-media \
  -F "number=628986182128-1627374981@g.us" \
  -F "caption=Check this out!" \
  -F "file=@/path/to/image.jpg"
```

**Example - Base64 Data URL:**
```bash
curl -X POST http://localhost:3000/send-media \
  -H "Content-Type: application/json" \
  -d '{
    "number": "628123456789",
    "caption": "Base64 image",
    "file": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  }'
```

**Example - Plain Base64:**
```bash
curl -X POST http://localhost:3000/send-media \
  -H "Content-Type: application/json" \
  -d '{
    "number": "628123456789",
    "caption": "Base64 image",
    "file": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "mimeType": "image/png"
  }'
```

**Example - URL:**
```bash
curl -X POST http://localhost:3000/send-media \
  -H "Content-Type: application/json" \
  -d '{
    "number": "628123456789",
    "caption": "Downloaded image",
    "file": "https://example.com/image.jpg"
  }'
```

**Example - URL to Group:**
```bash
curl -X POST http://localhost:3000/send-media \
  -H "Content-Type: application/json" \
  -d '{
    "number": "628986182128-1627374981@g.us",
    "caption": "Downloaded image",
    "file": "https://example.com/image.jpg"
  }'
```

### 6. Check if Number/Group is Registered (GET)
- **URL:** `GET /is-registered?number=PHONE_NUMBER_OR_GROUP_ID`
- **Description:** Check if a phone number is registered on WhatsApp or validate group ID format
- **Query Parameters:**
  - `number` (required): Phone number with country code OR group ID

**Example Request (Phone Number):**
```bash
curl -X GET "http://localhost:3000/is-registered?number=628123456789"
```

**Response (Phone Number):**
```json
{
  "status": true,
  "response": {
    "contactId": "628123456789@s.whatsapp.net",
    "isGroup": false,
    "isRegistered": true
  }
}
```

**Example Request (Group ID):**
```bash
curl -X GET "http://localhost:3000/is-registered?number=628986182128-1627374981@g.us"
```

**Response (Group ID):**
```json
{
  "status": true,
  "response": {
    "contactId": "628986182128-1627374981@g.us",
    "isGroup": true,
    "isRegistered": true
  }
}
```

### 7. Get All Groups
- **URL:** `GET /get-groups`
- **Description:** Get list of all groups the bot is a member of

**Example Request:**
```bash
curl -X GET http://localhost:3000/get-groups
```

**Response:**
```json
{
  "status": true,
  "response": [
    {
      "id": "120363123456789@g.us",
      "name": "Group Name",
      "participants": 5,
      "description": "Group description"
    }
  ]
}
```

### 8. Get Configuration
- **URL:** `GET /get-config`
- **Description:** Get current bot configuration (sensitive data excluded)

**Example Request:**
```bash
curl -X GET http://localhost:3000/get-config
```

**Response:**
```json
{
  "status": true,
  "response": {
    "name": "New WhatsApp API",
    "botName": "WA API Bot",
    "port": 3000,
    "defaultCountryCode": 62,
    "authRequired": false,
    "features": {
      "autoReply": false,
      "readMessages": true,
      "typing": true
    },
    "timezone": "Asia/Jakarta"
  }
}
```

## Supported Media Types

The `/send-media` endpoint automatically detects and handles these media types:

- **Images**: `image/*` (JPEG, PNG, GIF, WebP, etc.)
- **Videos**: `video/*` (MP4, AVI, MOV, etc.)
- **Audio**: `audio/*` (MP3, WAV, AAC, etc.)
- **Documents**: All other file types

## Error Responses

All endpoints return consistent error responses:

```json
{
  "status": false,
  "response": "Error message here"
}
```

Common HTTP status codes:
- `200`: Success
- `401`: Unauthorized (invalid credentials)
- `422`: Validation error (missing/invalid parameters)
- `500`: Internal server error

## Phone Number Format

Phone numbers should be provided with country code without the '+' symbol:

- ✅ Correct: `628123456789` (Indonesia)
- ✅ Correct: `1234567890` (US)
- ❌ Wrong: `+628123456789`
- ❌ Wrong: `08123456789` (will be auto-converted using defaultCountryCode)

## Rate Limiting

To avoid being banned by WhatsApp:
- Don't send messages too frequently
- Respect WhatsApp's terms of service
- Use the API responsibly

## Logging

All activities are logged to the file specified in `logFileName` config with timestamps in the configured timezone.
}
```

## Error Responses

All endpoints return error responses in the following format:

```json
{
  "status": false,
  "response": "Error message or validation errors"
}
```

### Common Error Codes:
- `422`: Validation error (missing required fields)
- `500`: Internal server error
- `404`: Endpoint not found

## Phone Number Format

Phone numbers should be in international format without the `+` symbol:
- ✅ Correct: `628123456789` (Indonesian number)
- ✅ Correct: `14155552671` (US number)
- ❌ Wrong: `+628123456789`
- ❌ Wrong: `08123456789` (without country code)

## Notes

1. Make sure WhatsApp is connected before making API calls
2. The bot must be added to groups before sending group messages
3. Phone numbers are automatically formatted with `@s.whatsapp.net` suffix
4. Group IDs typically end with `@g.us`

## Integration Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

async function sendMessage(number, message) {
  try {
    const response = await axios.post('http://localhost:3000/send-message', {
      number: number,
      message: message
    });
    console.log('Message sent:', response.data);
  } catch (error) {
    console.error('Error:', error.response.data);
  }
}

sendMessage('628123456789', 'Hello from Node.js!');
```

### Python
```python
import requests

def send_message(number, message):
    url = 'http://localhost:3000/send-message'
    data = {
        'number': number,
        'message': message
    }
    
    try:
        response = requests.post(url, json=data)
        print('Message sent:', response.json())
    except requests.exceptions.RequestException as e:
        print('Error:', e)

send_message('628123456789', 'Hello from Python!')
```

### PHP
```php
<?php
function sendMessage($number, $message) {
    $url = 'http://localhost:3000/send-message';
    $data = json_encode([
        'number' => $number,
        'message' => $message
    ]);
    
    $options = [
        'http' => [
            'header' => "Content-type: application/json\r\n",
            'method' => 'POST',
            'content' => $data
        ]
    ];
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    
    echo 'Response: ' . $result;
}

sendMessage('628123456789', 'Hello from PHP!');
?>
```
