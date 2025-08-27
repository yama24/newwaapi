# PM2 Configuration Port Sync Implementation

## Overview
Updated the PM2 ecosystem.config.js to dynamically read the port configuration from config.json, ensuring consistency between PM2 process management and direct Node.js execution.

## Changes Made

### ecosystem.config.js
- **Added**: Dynamic config.json loading at the top of the file
- **Added**: Error handling for missing or invalid config.json
- **Updated**: All environment configurations to use `config.port || 3000`
- **Maintained**: All existing PM2 configuration options

### Configuration Loading
```javascript
// Load configuration from config.json
const fs = require('fs')
let config
try {
  config = JSON.parse(fs.readFileSync('./config.json', 'utf8'))
} catch (error) {
  console.warn('Warning: Could not load config.json, using default port 3000')
  config = { port: 3000 }
}
```

### Environment Variables
Now dynamically set based on config.json:
- **Production**: `NODE_ENV=production`, `PORT: config.port || 3000`
- **Development**: `NODE_ENV=development`, `PORT: config.port || 3000`
- **Production**: `NODE_ENV=production`, `PORT: config.port || 3000`

## Benefits

### Consistency
- **Single Source of Truth**: Port configuration only needs to be set in config.json
- **No Duplication**: Eliminates the need to update port in multiple files
- **Automatic Sync**: PM2 always uses the same port as the application

### Error Handling
- **Graceful Fallback**: Uses default port 3000 if config.json is missing
- **Warning Messages**: Alerts users when config.json cannot be loaded
- **Robust**: Prevents PM2 from failing due to configuration issues

### Maintenance
- **Easier Updates**: Change port in one place (config.json)
- **Development Friendly**: Works seamlessly in all environments
- **Documentation Updated**: PM2.md reflects the new dynamic behavior

## Testing Verified

### Dynamic Loading
- ✅ Reads port correctly from config.json (tested with 3000)
- ✅ Updates automatically when config.json port changes (tested with 8080)
- ✅ Falls back to default port when config.json is missing
- ✅ PM2 ecosystem validation passes

### Syntax Validation
- ✅ Node.js syntax check passes
- ✅ PM2 can load the ecosystem configuration
- ✅ All environment variables are properly set

## Usage

### Normal Operation
```bash
# Port automatically read from config.json
./pm2.sh start
npm run pm2:start
pm2 start ecosystem.config.js
```

### Port Changes
```bash
# Edit config.json to change port
nano config.json  # Change "port": 3000 to desired port

# Restart PM2 to pick up new port
./pm2.sh restart
```

### Verification
```bash
# Check which port PM2 will use
node -e "const config = require('./ecosystem.config.js'); console.log('PORT:', config.apps[0].env.PORT)"
```

This implementation ensures that PM2 and the WhatsApp API application always use the same port configuration, eliminating configuration drift and making deployment more reliable.
