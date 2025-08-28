#!/bin/bash

# WhatsApp API PM2 Management Script

set -e

APP_NAME="whatsapp-api"
ECOSYSTEM_FILE="ecosystem.config.js"

show_help() {
    echo "WhatsApp API PM2 Management"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  start        Start the application with PM2"
    echo "  stop         Stop the application"
    echo "  restart      Restart the application"
    echo "  reload       Reload the application (zero downtime)"
    echo "  delete       Delete the application from PM2"
    echo "  status       Show application status"
    echo "  logs         Show application logs"
    echo "  monitor      Open PM2 monitoring dashboard"
    echo "  setup        Install PM2 and setup application"
    echo "  dev          Start in development mode"
    echo "  prod         Start in production mode"
    echo "  save         Save PM2 configuration"
    echo "  resurrect    Restore saved PM2 processes"
    echo "  startup      Setup PM2 startup script"
    echo "  unstartup    Remove PM2 startup script"
    echo ""
    echo "Options:"
    echo "  --watch      Enable file watching (for development)"
    echo "  --instances  Number of instances to run"
    echo ""
}

check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        echo "❌ PM2 is not installed. Installing PM2..."
        npm install -g pm2
        echo "✅ PM2 installed successfully"
    fi
}

check_config() {
    if [ ! -f config.json ]; then
        echo "⚠️  config.json not found. Creating from example..."
        cp config.json.example config.json
        echo "✅ config.json created. Please edit it with your settings."
        echo "⚠️  You may want to stop and configure before continuing."
    fi
}

ensure_logs_dir() {
    if [ ! -d "logs" ]; then
        mkdir -p logs
        echo "✅ Created logs directory"
    fi
}

start_app() {
    local env="${1:-production}"
    local watch_flag=""
    local instances="${2:-1}"
    
    if [ "$3" = "--watch" ]; then
        watch_flag="--watch"
    fi
    
    echo "Starting WhatsApp API in $env mode..."
    check_pm2
    check_config
    ensure_logs_dir
    
    if [ "$env" = "development" ]; then
        pm2 start $ECOSYSTEM_FILE --env development $watch_flag
    else
        pm2 start $ECOSYSTEM_FILE --env production --instances $instances
    fi
    
    echo "✅ WhatsApp API started successfully!"
    pm2 status
}

stop_app() {
    echo "Stopping WhatsApp API..."
    pm2 stop $APP_NAME
    echo "✅ WhatsApp API stopped"
}

restart_app() {
    echo "Restarting WhatsApp API..."
    pm2 restart $APP_NAME
    echo "✅ WhatsApp API restarted"
}

reload_app() {
    echo "Reloading WhatsApp API (zero downtime)..."
    pm2 reload $APP_NAME
    echo "✅ WhatsApp API reloaded"
}

delete_app() {
    echo "Deleting WhatsApp API from PM2..."
    pm2 delete $APP_NAME
    echo "✅ WhatsApp API deleted from PM2"
}

show_status() {
    echo "WhatsApp API Status:"
    pm2 status $APP_NAME
    echo ""
    pm2 info $APP_NAME
}

show_logs() {
    echo "Showing WhatsApp API logs..."
    pm2 logs $APP_NAME --lines 50
}

open_monitor() {
    echo "Opening PM2 monitoring dashboard..."
    pm2 monit
}

setup_pm2() {
    echo "Setting up PM2 for WhatsApp API..."
    check_pm2
    check_config
    ensure_logs_dir
    
    echo "✅ PM2 setup completed!"
    echo ""
    echo "Next steps:"
    echo "1. Edit config.json with your settings"
    echo "2. Run: $0 start"
    echo "3. Optional: $0 startup (for auto-start on boot)"
}

save_config() {
    echo "Saving PM2 configuration..."
    pm2 save
    echo "✅ PM2 configuration saved"
}

resurrect_processes() {
    echo "Restoring saved PM2 processes..."
    pm2 resurrect
    echo "✅ PM2 processes restored"
}

setup_startup() {
    echo "Setting up PM2 startup script..."
    echo "You may need to run the following command with sudo:"
    pm2 startup
    echo ""
    echo "After running the startup command, save the configuration:"
    echo "$0 save"
}

remove_startup() {
    echo "Removing PM2 startup script..."
    pm2 unstartup
    echo "✅ PM2 startup script removed"
}

# Parse command line arguments
case "$1" in
    start)
        start_app production "$2" "$3"
        ;;
    stop)
        stop_app
        ;;
    restart)
        restart_app
        ;;
    reload)
        reload_app
        ;;
    delete)
        delete_app
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    monitor)
        open_monitor
        ;;
    setup)
        setup_pm2
        ;;
    dev)
        start_app development "1" "$2"
        ;;
    prod)
        start_app production "$2" "$3"
        ;;
    save)
        save_config
        ;;
    resurrect)
        resurrect_processes
        ;;
    startup)
        setup_startup
        ;;
    unstartup)
        remove_startup
        ;;
    *)
        show_help
        exit 1
        ;;
esac
