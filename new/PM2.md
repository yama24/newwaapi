# PM2 Process Management Guide

## Overview
This guide covers running the WhatsApp REST API using PM2 for production process management with automatic restarts, monitoring, and clustering.

## Prerequisites
- Node.js 20+ installed
- NPM or Yarn package manager
- PM2 will be installed automatically if not present

## Quick Start

### 1. Setup PM2
```bash
# Install PM2 globally (if not already installed)
npm install -g pm2

# Or use the setup script
./pm2.sh setup
```

### 2. Configure Application
```bash
# Ensure configuration exists
cp config.json.example config.json
nano config.json  # Edit with your settings
```

### 3. Start Application
```bash
# Production mode
./pm2.sh start

# Development mode with file watching
./pm2.sh dev

# Or use npm scripts
npm run pm2:start
```

## PM2 Configuration (ecosystem.config.js)

### Application Settings
```javascript
{
  name: 'whatsapp-api',
  script: 'index.js',
  node_args: '--experimental-global-webcrypto',
  instances: 1,
  exec_mode: 'fork',
  autorestart: true,
  max_memory_restart: '2G'
}
```

### Environment Variables
- **Production**: `NODE_ENV=production`, `PORT=3000`
- **Development**: `NODE_ENV=development`, `PORT=3000`

### Logging Configuration
- **Error Log**: `./logs/pm2-error.log`
- **Output Log**: `./logs/pm2-out.log`
- **Combined Log**: `./logs/pm2-combined.log`

### Restart Policy
- **Max Restarts**: 10 restarts
- **Min Uptime**: 10 seconds
- **Restart Delay**: 4 seconds
- **Kill Timeout**: 10 seconds

## Management Commands

### Using PM2 Script (./pm2.sh)
```bash
# Application lifecycle
./pm2.sh start      # Start in production mode
./pm2.sh dev        # Start in development mode with watch
./pm2.sh stop       # Stop the application
./pm2.sh restart    # Restart the application
./pm2.sh reload     # Zero-downtime reload
./pm2.sh delete     # Remove from PM2

# Monitoring and logs
./pm2.sh status     # Show application status
./pm2.sh logs       # Show application logs
./pm2.sh monitor    # Open PM2 monitoring dashboard

# Configuration
./pm2.sh save       # Save PM2 configuration
./pm2.sh resurrect  # Restore saved processes
./pm2.sh startup    # Setup auto-start on boot
./pm2.sh unstartup  # Remove auto-start
```

### Using NPM Scripts
```bash
# Application lifecycle
npm run pm2:start    # Start in production
npm run pm2:dev      # Start in development with watch
npm run pm2:stop     # Stop application
npm run pm2:restart  # Restart application
npm run pm2:reload   # Zero-downtime reload
npm run pm2:delete   # Remove from PM2

# Monitoring
npm run pm2:status   # Show status
npm run pm2:logs     # Show logs
npm run pm2:monit    # Open monitoring dashboard
```

### Direct PM2 Commands
```bash
# Start with ecosystem file
pm2 start ecosystem.config.js

# Start with specific environment
pm2 start ecosystem.config.js --env production
pm2 start ecosystem.config.js --env development

# Application management
pm2 stop whatsapp-api
pm2 restart whatsapp-api
pm2 reload whatsapp-api
pm2 delete whatsapp-api

# Monitoring
pm2 status
pm2 logs whatsapp-api
pm2 monit
pm2 info whatsapp-api
```

## Production Setup

### 1. Install PM2 Globally
```bash
npm install -g pm2
```

### 2. Setup Auto-Start on Boot
```bash
# Generate startup script
pm2 startup

# Follow the instructions to run the generated command with sudo
# Example: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u user --hp /home/user

# Start your application
./pm2.sh start

# Save PM2 configuration
pm2 save
```

### 3. Verify Setup
```bash
# Check status
pm2 status

# Test restart functionality
sudo reboot
# After reboot, check if application auto-started
pm2 status
```

## Clustering and Scaling

### Enable Clustering
Edit `ecosystem.config.js`:
```javascript
{
  instances: 'max',        // Use all CPU cores
  exec_mode: 'cluster'     // Enable cluster mode
}
```

### Scale Instances
```bash
# Scale to specific number of instances
pm2 scale whatsapp-api 4

# Scale to maximum CPU cores
pm2 scale whatsapp-api max
```

## Monitoring and Debugging

### Real-time Monitoring
```bash
# PM2 built-in monitoring
pm2 monit

# Application logs
pm2 logs whatsapp-api --lines 100

# Follow logs in real-time
pm2 logs whatsapp-api -f
```

### Application Metrics
```bash
# Detailed application info
pm2 info whatsapp-api

# Show application list
pm2 list

# Process status
pm2 status
```

### Memory and CPU Monitoring
```bash
# Memory usage
pm2 list | grep whatsapp-api

# Restart on memory limit
# (configured in ecosystem.config.js as max_memory_restart: '2G')
```

## Log Management

### Log Files Location
- **PM2 Error Log**: `./logs/pm2-error.log`
- **PM2 Output Log**: `./logs/pm2-out.log`
- **PM2 Combined Log**: `./logs/pm2-combined.log`
- **Application Log**: `./wa-logs.json`

### Log Rotation
```bash
# Install PM2 log rotate module
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

### View Logs
```bash
# Recent logs
pm2 logs whatsapp-api --lines 50

# Live logs
pm2 logs whatsapp-api -f

# Error logs only
pm2 logs whatsapp-api --err

# Output logs only
pm2 logs whatsapp-api --out
```

## Environment Management

### Production Environment
```bash
# Start in production mode
pm2 start ecosystem.config.js --env production

# Environment variables for production
NODE_ENV=production
PORT=3000
```

### Development Environment
```bash
# Start in development mode with file watching
pm2 start ecosystem.config.js --env development --watch

# Environment variables for development
NODE_ENV=development
PORT=3000
```

### Custom Environment
Add to `ecosystem.config.js`:
```javascript
env_staging: {
  NODE_ENV: 'staging',
  PORT: 3001,
  API_URL: 'https://staging-api.example.com'
}
```

Start with custom environment:
```bash
pm2 start ecosystem.config.js --env staging
```

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check PM2 logs
pm2 logs whatsapp-api --err

# Check application configuration
node -c index.js

# Verify ecosystem configuration
pm2 ecosystem
```

#### High Memory Usage
```bash
# Check memory usage
pm2 list

# Restart application
pm2 restart whatsapp-api

# Check for memory leaks in logs
pm2 logs whatsapp-api | grep -i memory
```

#### Application Crashes
```bash
# Check crash logs
pm2 logs whatsapp-api --err --lines 100

# Restart application
pm2 restart whatsapp-api

# Check restart count
pm2 info whatsapp-api
```

### Debug Mode
```bash
# Start with debug output
NODE_ENV=development pm2 start ecosystem.config.js --watch

# Enable PM2 debug logs
DEBUG=pm2:* pm2 start ecosystem.config.js
```

## Performance Optimization

### CPU Optimization
- Use clustering for CPU-intensive operations
- Monitor CPU usage with `pm2 monit`
- Adjust `instances` in ecosystem.config.js

### Memory Optimization
- Set appropriate `max_memory_restart` limit
- Monitor memory usage patterns
- Use `pm2 reload` for zero-downtime restarts

### Process Management
- Configure appropriate restart delays
- Set minimum uptime requirements
- Monitor application health

## Security Considerations

### Process Isolation
- Run PM2 with non-root user
- Use proper file permissions
- Isolate application directories

### Log Security
- Secure log file permissions
- Implement log rotation
- Monitor for sensitive data in logs

### Environment Variables
- Store sensitive data in environment files
- Use PM2 environment management
- Avoid hardcoding credentials

## Backup and Recovery

### Configuration Backup
```bash
# Save PM2 configuration
pm2 save

# Backup ecosystem file
cp ecosystem.config.js ecosystem.config.js.backup
```

### Process Recovery
```bash
# Restore saved processes
pm2 resurrect

# Restart all processes
pm2 restart all
```

## Integration with Other Tools

### Nginx Reverse Proxy
```nginx
upstream whatsapp_api {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://whatsapp_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Systemd Integration
PM2 integrates with systemd for proper service management:
```bash
pm2 startup systemd
```

### Monitoring Integration
- **PM2 Plus**: Cloud monitoring dashboard
- **Custom monitoring**: Export metrics to external systems
- **Alerting**: Configure alerts for process failures

## Migration from Other Process Managers

### From Forever
```bash
# Stop forever processes
forever stopall

# Start with PM2
pm2 start ecosystem.config.js
```

### From systemd
```bash
# Disable systemd service
sudo systemctl disable your-service

# Start with PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

This comprehensive PM2 setup provides production-ready process management with automatic restarts, monitoring, clustering capabilities, and proper logging for your WhatsApp API.
