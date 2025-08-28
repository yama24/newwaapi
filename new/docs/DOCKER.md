# Docker Deployment Guide

## Overview
This guide covers deploying the WhatsApp REST API using Docker with Node.js 20+.

## Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB disk space

## Quick Start

### 1. Setup Configuration
```bash
# Clone repository
git clone <your-repo-url>
cd newwaapi

# Setup configuration files
npm run docker:setup
# or manually:
# cp config.json.example config.json
# cp .env.example .env

# Edit configuration files
nano config.json  # WhatsApp API settings
nano .env         # Docker environment variables
```

### 2. Deploy with Docker Compose
```bash
# Start the application
docker-compose up -d

# View logs
docker-compose logs -f whatsapp-api

# Check status
docker-compose ps
```

### 3. Access the API
- **API Endpoint**: http://localhost:3000
- **Health Check**: http://localhost:3000/info

## Configuration Files

### config.json
Main application configuration:
```json
{
  "name": "WhatsApp API Docker",
  "port": 3000,
  "authRequired": true,
  "username": "admin",
  "password": "admin123",
  "pairing": {
    "usePairingCode": true,
    "phoneNumber": "YOUR_PHONE_NUMBER"
  }
}
```

### .env
Docker environment variables:
```env
WA_USERNAME=admin
WA_PASSWORD=admin123
NODE_ENV=production
COMPOSE_PROJECT_NAME=whatsapp-api
```

## Docker Services

### Main Service: whatsapp-api
- **Image**: Node.js 20 Alpine
- **Port**: 3000
- **Health Check**: Built-in endpoint monitoring
- **Restart Policy**: unless-stopped

## Persistent Data

### Volumes
- `./session_newsession:/app/session_newsession` - WhatsApp session data
- `./logs:/app/logs` - Application logs
- `./config.json:/app/config.json:ro` - Configuration (read-only)

### Data Backup
```bash
# Backup session data
tar -czf whatsapp-session-backup.tar.gz session_newsession/

# Restore session data
tar -xzf whatsapp-session-backup.tar.gz
```

## Management Commands

### Using Docker Compose
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f whatsapp-api

# Scale (if needed)
docker-compose up -d --scale whatsapp-api=2
```

### Using Docker Script
```bash
# Management script
./docker.sh [command]

# Available commands:
./docker.sh setup     # Setup config files
./docker.sh build     # Build image
./docker.sh start     # Start container
./docker.sh stop      # Stop container
./docker.sh restart   # Restart container
./docker.sh logs      # Show logs
./docker.sh shell     # Access container
./docker.sh status    # Show status
./docker.sh clean     # Remove everything
```

### Using NPM Scripts
```bash
npm run docker:setup   # Setup configuration
npm run docker:build   # Build Docker image
npm run docker:start   # Start containers
npm run docker:stop    # Stop containers
npm run docker:logs    # View logs
```

## Health Monitoring

### Built-in Health Check
The container includes automatic health monitoring:
```bash
# Check container health
docker inspect whatsapp-api | grep Health -A 10

# Manual health check
curl http://localhost:3000/info
```

### Monitoring with External Tools
```bash
# Using wget
wget --spider http://localhost:3000/info

# Using curl with timeout
curl -f --max-time 10 http://localhost:3000/info
```

## Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check logs
docker-compose logs whatsapp-api

# Check if port is in use
sudo netstat -tlnp | grep 3000

# Check Docker service
sudo systemctl status docker
```

#### Session Issues
```bash
# Remove old session
rm -rf session_newsession/*

# Restart container
docker-compose restart whatsapp-api
```

#### Permission Issues
```bash
# Fix permissions
sudo chown -R $USER:$USER session_newsession/
sudo chmod -R 755 session_newsession/
```

### Debug Mode
```bash
# Run in foreground with debug output
docker-compose up

# Access container shell
docker exec -it whatsapp-api sh

# Check Node.js version
docker exec whatsapp-api node -v
```

## Security Considerations

### Environment Variables
- Store sensitive data in `.env` file
- Never commit `.env` to version control
- Use Docker secrets for production

### Network Security
```yaml
# Custom network configuration
networks:
  whatsapp-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

### Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 3000/tcp
sudo ufw enable
```

## Production Deployment

### Resource Limits
```yaml
services:
  whatsapp-api:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 2G
        reservations:
          memory: 512M
```

### Logging Configuration
```yaml
services:
  whatsapp-api:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Updates and Maintenance

### Updating the Application
```bash
# Pull latest code
git pull origin main

# Rebuild image
docker-compose build

# Restart with new image
docker-compose up -d
```

### Cleanup
```bash
# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Complete cleanup
./docker.sh clean
```

## Support

For issues with Docker deployment:
1. Check container logs
2. Verify configuration files
3. Ensure Docker daemon is running
4. Check available system resources
5. Refer to main project documentation
