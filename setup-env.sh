#!/bin/bash

# Setup Environment Script for Airplane Tracker
# This script creates a .env file from env.example if it doesn't exist

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Setting up environment configuration...${NC}"

# Check if .env already exists
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env file already exists${NC}"
    echo -e "${BLUE}📋 Current .env contents:${NC}"
    echo "----------------------------------------"
    cat .env
    echo "----------------------------------------"
    echo ""
    echo -e "${YELLOW}⚠️  If you want to update with new values, delete .env and run this script again${NC}"
    exit 0
fi

# Check if env.example exists
if [ ! -f "env.example" ]; then
    echo -e "${YELLOW}❌ env.example file not found${NC}"
    exit 1
fi

# Create .env from env.example
echo -e "${BLUE}📝 Creating .env file from env.example...${NC}"
cp env.example .env

echo -e "${GREEN}✅ .env file created successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Please edit the .env file with your actual values:${NC}"
echo "  - AVIATION_API_KEY: Your Aviation Stack API key"
echo "  - OPENSKY_USERNAME: Your OpenSky Network username (optional)"
echo "  - OPENSKY_PASSWORD: Your OpenSky Network password (optional)"
echo "  - AIRCRAFT_UPDATE_INTERVAL: How often to update aircraft data (default: 30 seconds)"
echo ""
echo -e "${BLUE}🔧 You can edit the file with:${NC}"
echo "  nano .env"
echo "  # or"
echo "  vim .env"
echo "  # or"
echo "  code .env"
echo ""
echo -e "${GREEN}🚀 After editing, you can run:${NC}"
echo "  ./docker-build.sh"
echo "  # or"
echo "  docker-compose up --build"

