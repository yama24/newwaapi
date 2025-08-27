#!/bin/bash

# WhatsApp API Docker Management Script

set -e

CONTAINER_NAME="whatsapp-api"
IMAGE_NAME="whatsapp-api"

show_help() {
    echo "WhatsApp API Docker Management"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  build     Build the Docker image"
    echo "  start     Start the container with docker-compose"
    echo "  stop      Stop the container"
    echo "  restart   Restart the container"
    echo "  logs      Show container logs"
    echo "  shell     Access container shell"
    echo "  status    Show container status"
    echo "  clean     Remove container and image"
    echo "  setup     Initial setup (copy config files)"
    echo ""
}

build_image() {
    echo "Building WhatsApp API Docker image..."
    docker build -t $IMAGE_NAME .
    echo "Image built successfully!"
}

start_container() {
    echo "Starting WhatsApp API container..."
    if [ ! -f config.json ]; then
        echo "⚠️  config.json not found. Running setup first..."
        setup_files
    fi
    docker-compose up -d
    echo "Container started successfully!"
    echo "API available at: http://localhost:3000"
}

stop_container() {
    echo "Stopping WhatsApp API container..."
    docker-compose down
    echo "Container stopped successfully!"
}

restart_container() {
    echo "Restarting WhatsApp API container..."
    docker-compose restart
    echo "Container restarted successfully!"
}

show_logs() {
    echo "Showing WhatsApp API container logs..."
    docker-compose logs -f whatsapp-api
}

access_shell() {
    echo "Accessing WhatsApp API container shell..."
    docker exec -it $CONTAINER_NAME sh
}

show_status() {
    echo "WhatsApp API Container Status:"
    docker-compose ps
    echo ""
    echo "Docker Image:"
    docker images | grep $IMAGE_NAME || echo "Image not found"
}

clean_all() {
    echo "Cleaning up WhatsApp API Docker resources..."
    docker-compose down --volumes
    docker rmi $IMAGE_NAME 2>/dev/null || echo "Image not found"
    echo "Cleanup completed!"
}

setup_files() {
    echo "Setting up configuration files..."
    if [ ! -f config.json ]; then
        cp config.json.example config.json
        echo "✅ config.json created from example"
        echo "⚠️  Please edit config.json with your settings"
    fi
    if [ ! -f .env ]; then
        cp .env.example .env
        echo "✅ .env created from example"
        echo "⚠️  Please edit .env with your credentials"
    fi
    echo "Setup completed!"
}

case "$1" in
    build)
        build_image
        ;;
    start)
        start_container
        ;;
    stop)
        stop_container
        ;;
    restart)
        restart_container
        ;;
    logs)
        show_logs
        ;;
    shell)
        access_shell
        ;;
    status)
        show_status
        ;;
    clean)
        clean_all
        ;;
    setup)
        setup_files
        ;;
    *)
        show_help
        exit 1
        ;;
esac
