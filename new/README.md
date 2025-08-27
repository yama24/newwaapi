# WhatsApp REST API

A powerful and configurable WhatsApp REST API built with Baileys library.

## Requirements

- **Node.js**: Version 20 or higher (tested with Node.js 22.14.0)
- **npm**: Latest stable version

## Features

- 🚀 REST API endpoints for sending messages
- 🔧 Configurable settings via JSON
- 🔐 Optional Basic Authentication
- 📱 Support for individual and group messages
- ✅ Phone number validation
- 📋 Group management
- 🎯 Pairing code or QR code authentication
- 📝 Comprehensive logging
- 🛠️ Easy setup script
- 🐳 Docker support with Node.js 20+

## Table of Contents

- [Requirements](#requirements)
- [Features](#features)
- [Quick Start](#quick-start)
- [Docker Deployment](#docker-deployment)
- [Configuration](#configuration)
- [API Usage](#api-usage)
- [Authentication](#authentication)
- [Contributing](#contributing)

## Quick Start

### 1. Installation
```bash
npm install
```

### 2. Setup Configuration
Run the interactive setup:
```bash
npm run setup
```

Or manually copy and edit the config:
```bash
cp config.json.example config.json
# Edit config.json with your settings
```

### 3. Start the Server
```bash
npm start
```

## Docker Deployment

### Prerequisites
- Docker and Docker Compose installed
- Node.js 20+ (for local development)

### Quick Start with Docker

1. **Clone and Setup**
```bash
git clone <repository-url>
cd newwaapi
cp config.json.example config.json
# Edit config.json with your settings
```

2. **Build and Run**
```bash
docker-compose up -d
```

3. **View Logs**
```bash
docker-compose logs -f whatsapp-api
```

### Docker Configuration

The Docker setup includes:
- **Base Image**: Node.js 20 Alpine for minimal size
- **Health Checks**: Automatic container health monitoring
- **Volume Mounts**: Persistent session and log data
- **Environment Variables**: Configurable via .env file

### Environment Variables
Create a `.env` file from the example:
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
WA_USERNAME=your_username
WA_PASSWORD=your_password
NODE_ENV=production
```

### Docker Commands

```bash
# Build the image
docker build -t whatsapp-api .

# Run container
docker run -d -p 3000:3000 \
  -v $(pwd)/session_newsession:/app/session_newsession \
  -v $(pwd)/config.json:/app/config.json:ro \
  --name whatsapp-api \
  whatsapp-api

# Stop container
docker-compose down

# View container logs
docker logs whatsapp-api

# Access container shell
docker exec -it whatsapp-api sh
```

## PM2 Process Management

### Prerequisites
- Node.js 20+ and npm installed
- PM2 will be installed automatically if needed

### Quick Start with PM2

1. **Setup PM2**
```bash
# Install PM2 globally (optional, script will install if needed)
npm install -g pm2

# Setup configuration
./pm2.sh setup
```

2. **Configure and Start**
```bash
# Edit configuration if needed
nano config.json

# Start in production mode
./pm2.sh start

# Or start in development mode with file watching
./pm2.sh dev
```

3. **Monitor and Manage**
```bash
# Check status
./pm2.sh status

# View logs
./pm2.sh logs

# Open monitoring dashboard
./pm2.sh monitor
```

### PM2 Features
- **Process Management**: Automatic restarts, clustering, monitoring
- **Zero Downtime**: Graceful reloads without service interruption
- **Log Management**: Centralized logging with rotation
- **Startup Scripts**: Auto-start on system boot
- **Memory Management**: Automatic restart on memory limits

### PM2 Commands

```bash
# Application lifecycle
./pm2.sh start      # Start production
./pm2.sh dev        # Start development with watch
./pm2.sh stop       # Stop application
./pm2.sh restart    # Restart application
./pm2.sh reload     # Zero-downtime reload

# Monitoring
./pm2.sh status     # Show status
./pm2.sh logs       # Show logs
./pm2.sh monitor    # Open dashboard

# Production setup
./pm2.sh startup    # Setup auto-start on boot
./pm2.sh save       # Save configuration
```

### NPM Scripts for PM2
```bash
npm run pm2:start    # Start production
npm run pm2:dev      # Start development
npm run pm2:stop     # Stop application
npm run pm2:restart  # Restart application
npm run pm2:logs     # Show logs
npm run pm2:status   # Show status
```

## Configuration

The application uses `config.json` for all settings:

```json
{
  "name": "New WhatsApp API",
  "botName": "WA API Bot",
  "port": 3000,
  "defaultCountryCode": 62,
  "authRequired": false,
  "username": "admin",
  "password": "admin123",
  "pairing": {
    "usePairingCode": true,
    "phoneNumber": ""
  },
  "features": {
    "autoReply": false,
    "readMessages": true,
    "typing": true
  }
}
```

### Key Configuration Options

- **authRequired**: Enable API authentication
- **pairing.usePairingCode**: Use pairing code instead of QR
- **features.autoReply**: Auto-reply to incoming messages
- **features.readMessages**: Mark messages as read
- **features.typing**: Show typing indicator

## API Endpoints

### Authentication
If `authRequired` is enabled, include Basic Auth:
```bash
curl -u "username:password" http://localhost:3000/info
```

### Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/info` | Get bot information |
| POST | `/send-message` | Send message to individual |
| POST | `/send-group-message` | Send message to group |
| POST | `/check-number` | Check if number is registered |
| GET | `/get-groups` | Get all groups |
| GET | `/get-config` | Get configuration |

### Example: Send Message
```bash
curl -X POST http://localhost:3000/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "number": "628123456789",
    "message": "Hello from API!"
  }'
```

## Phone Number Format

Use international format without `+`:
- ✅ `628123456789` (Indonesia)
- ✅ `14155552671` (US)
- ❌ `+628123456789`
- ❌ `08123456789`

## Session Management

Sessions are stored in `session_[sessionName]` folder. The session persists across restarts, so you only need to authenticate once.

## Logging

Logs are written to the file specified in `logFileName` config. Log levels: `trace`, `debug`, `info`, `warn`, `error`, `fatal`.

## Troubleshooting

### Port Already in Use
Change the port in `config.json` or set environment variable:
```bash
PORT=8080 npm start
```

### Authentication Issues
Check your `username` and `password` in config.json when `authRequired` is true.

### WhatsApp Connection Issues
1. Delete session folder to re-authenticate
2. Check internet connection
3. Ensure phone number format is correct

## Development

Run in development mode:
```bash
npm run dev
```

This enables pairing code mode and other development features.

## Docker Support

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t whatsapp-api .
docker run -p 3000:3000 -v $(pwd)/session_newsession:/app/session_newsession whatsapp-api
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check the [API Documentation](./API_DOCUMENTATION.md)
2. Review the configuration options
3. Check logs in the specified log file
4. Open an issue on GitHub

## Roadmap

- [ ] Media message support (images, videos, documents)
- [ ] Webhook support for incoming messages
- [ ] Message templates
- [ ] Bulk messaging
- [ ] Message scheduling
- [ ] Contact management
- [ ] Group administration features
