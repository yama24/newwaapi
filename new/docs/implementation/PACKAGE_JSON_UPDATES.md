# Package.json References Update

## Fixed Script References

After reorganizing the project structure, the following npm scripts needed to be updated to point to the new file locations:

### Before (Broken References):
```json
{
  "scripts": {
    "pm2:setup": "./pm2.sh setup",
    "docker:build": "docker build -t whatsapp-api .",
    "docker:start": "docker-compose up -d",
    "docker:stop": "docker-compose down",
    "docker:logs": "docker-compose logs -f whatsapp-api",
    "docker:setup": "./docker.sh setup"
  }
}
```

### After (Fixed References):
```json
{
  "scripts": {
    "pm2:setup": "./scripts/deployment/pm2.sh setup",
    "docker:build": "docker build -f docker/Dockerfile -t whatsapp-api .",
    "docker:start": "docker-compose -f docker/docker-compose.yml up -d",
    "docker:stop": "docker-compose -f docker/docker-compose.yml down",
    "docker:logs": "docker-compose -f docker/docker-compose.yml logs -f whatsapp-api",
    "docker:setup": "./scripts/deployment/docker.sh setup"
  }
}
```

## Changes Made:

1. **PM2 Scripts**:
   - `./pm2.sh` → `./scripts/deployment/pm2.sh`

2. **Docker Scripts**:
   - `./docker.sh` → `./scripts/deployment/docker.sh`

3. **Docker Build**:
   - `docker build -t whatsapp-api .` → `docker build -f docker/Dockerfile -t whatsapp-api .`

4. **Docker Compose Commands**:
   - `docker-compose up -d` → `docker-compose -f docker/docker-compose.yml up -d`
   - `docker-compose down` → `docker-compose -f docker/docker-compose.yml down`
   - `docker-compose logs -f whatsapp-api` → `docker-compose -f docker/docker-compose.yml logs -f whatsapp-api`

## Usage:

Now all npm scripts work correctly with the new file structure:

```bash
# PM2 Management
npm run pm2:start        # Start with PM2
npm run pm2:dev          # Start in development mode
npm run pm2:setup        # Setup PM2 configuration

# Docker Management
npm run docker:build     # Build Docker image
npm run docker:start     # Start with Docker Compose
npm run docker:stop      # Stop Docker containers
npm run docker:logs      # View Docker logs
npm run docker:setup     # Setup Docker configuration

# Standard Commands (unchanged)
npm start                # Start application
npm run dev              # Start in development mode
npm run setup            # Run setup wizard
```

All references are now correctly pointing to the reorganized file locations!
