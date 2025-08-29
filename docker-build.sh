#!/bin/bash

# Docker Build Script for Airplane Tracker
# This script builds and runs the application in Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="airplane-tracker"
CONTAINER_NAME="airplane-tracker-app"
PORT=3001

echo -e "${BLUE}🚀 Airplane Tracker Docker Build Script${NC}"
echo "=========================================="

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Docker is running${NC}"
}

# Function to check if port is available
check_port() {
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${YELLOW}⚠️  Port $PORT is already in use${NC}"
        read -p "Do you want to stop the existing container? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker stop $CONTAINER_NAME 2>/dev/null || true
            docker rm $CONTAINER_NAME 2>/dev/null || true
            echo -e "${GREEN}✅ Stopped existing container${NC}"
        else
            echo -e "${RED}❌ Port $PORT is required. Exiting.${NC}"
            exit 1
        fi
    fi
}

# Function to build the image
build_image() {
    echo -e "${BLUE}🔨 Building Docker image...${NC}"
    
    # Check if Dockerfile exists
    if [ ! -f "Dockerfile" ]; then
        echo -e "${RED}❌ Dockerfile not found in current directory${NC}"
        exit 1
    fi
    
    # Build the image
    docker build -t $IMAGE_NAME .
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Image built successfully${NC}"
    else
        echo -e "${RED}❌ Failed to build image${NC}"
        exit 1
    fi
}

# Function to run the container
run_container() {
    echo -e "${BLUE}🚀 Starting container...${NC}"
    
    # Create data directory if it doesn't exist
    mkdir -p data
    
    # Load environment variables from .env file if it exists
    if [ -f ".env" ]; then
        echo -e "${GREEN}✅ Loading environment variables from .env file${NC}"
        export $(grep -v '^#' .env | xargs)
    else
        echo -e "${YELLOW}⚠️  No .env file found, using default values${NC}"
    fi
    
    # Run the container
    docker run -d \
        --name $CONTAINER_NAME \
        -p $PORT:$PORT \
        -v "$(pwd)/data:/app/data" \
        -v "$(pwd)/.env:/app/.env:ro" \
        -e NODE_ENV=production \
        -e PORT=$PORT \
        -e AIRCRAFT_UPDATE_INTERVAL=${AIRCRAFT_UPDATE_INTERVAL:-30} \
        -e USER_LOCATION_CACHE_DURATION=${USER_LOCATION_CACHE_DURATION:-300} \
        -e DB_PATH=/app/data/airplanes.db \
        -e ALLOWED_ORIGINS=http://localhost:$PORT \
        -e AVIATION_API_KEY=${AVIATION_API_KEY} \
        -e AVIATION_API_BASE_URL=${AVIATION_API_BASE_URL:-https://api.aviationstack.com/v1} \
        -e OPENSKY_USERNAME=${OPENSKY_USERNAME} \
        -e OPENSKY_PASSWORD=${OPENSKY_PASSWORD} \
        --restart unless-stopped \
        $IMAGE_NAME
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Container started successfully${NC}"
    else
        echo -e "${RED}❌ Failed to start container${NC}"
        exit 1
    fi
}

# Function to check container status
check_status() {
    echo -e "${BLUE}📊 Checking container status...${NC}"
    
    # Wait a moment for container to start
    sleep 5
    
    # Check if container is running
    if docker ps | grep -q $CONTAINER_NAME; then
        echo -e "${GREEN}✅ Container is running${NC}"
        
        # Check container health
        HEALTH_STATUS=$(docker inspect --format='{{.State.Health.Status}}' $CONTAINER_NAME 2>/dev/null || echo "no-health-check")
        
        if [ "$HEALTH_STATUS" = "healthy" ]; then
            echo -e "${GREEN}✅ Container is healthy${NC}"
        elif [ "$HEALTH_STATUS" = "starting" ]; then
            echo -e "${YELLOW}⏳ Container is starting up...${NC}"
        else
            echo -e "${YELLOW}⚠️  Health check status: $HEALTH_STATUS${NC}"
        fi
        
        # Show container info
        echo -e "${BLUE}📋 Container Information:${NC}"
        echo "  Name: $CONTAINER_NAME"
        echo "  Image: $IMAGE_NAME"
        echo "  Port: $PORT"
        echo "  Status: $(docker inspect --format='{{.State.Status}}' $CONTAINER_NAME)"
        
        # Show access URLs
        echo -e "${BLUE}🌐 Access URLs:${NC}"
        echo "  Frontend: http://localhost:$PORT"
        echo "  API: http://localhost:$PORT/api"
        echo "  Health: http://localhost:$PORT/api/health"
        
    else
        echo -e "${RED}❌ Container is not running${NC}"
        echo -e "${BLUE}📋 Checking container logs...${NC}"
        docker logs $CONTAINER_NAME
        exit 1
    fi
}

# Function to show useful commands
show_commands() {
    echo -e "${BLUE}🔧 Useful Commands:${NC}"
    echo "  View logs: docker logs -f $CONTAINER_NAME"
    echo "  Stop container: docker stop $CONTAINER_NAME"
    echo "  Start container: docker start $CONTAINER_NAME"
    echo "  Restart container: docker restart $CONTAINER_NAME"
    echo "  Remove container: docker rm $CONTAINER_NAME"
    echo "  Access shell: docker exec -it $CONTAINER_NAME sh"
    echo "  View container info: docker inspect $CONTAINER_NAME"
}

# Function to cleanup on exit
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
}

# Set trap for cleanup
trap cleanup EXIT

# Main execution
main() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    check_docker
    check_port
    
    echo -e "${BLUE}🏗️  Building application...${NC}"
    build_image
    
    echo -e "${BLUE}🚀 Deploying application...${NC}"
    run_container
    
    echo -e "${BLUE}✅ Verifying deployment...${NC}"
    check_status
    
    echo ""
    echo -e "${GREEN}🎉 Airplane Tracker is now running in Docker!${NC}"
    echo ""
    
    show_commands
    
    echo ""
    echo -e "${BLUE}📱 Open your browser and navigate to: http://localhost:$PORT${NC}"
    echo -e "${BLUE}⏹️  Press Ctrl+C to stop the container${NC}"
    
    # Keep script running and show logs
    echo -e "${BLUE}📋 Showing container logs (Ctrl+C to exit)...${NC}"
    docker logs -f $CONTAINER_NAME
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
