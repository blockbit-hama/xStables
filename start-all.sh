#!/bin/bash

# xStables - Start All Services Script
# This script starts both frontend and backend services

set -e  # Exit on any error

echo "🚀 Starting xStables Services..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${RED}❌ Port $port is already in use${NC}"
        echo -e "${YELLOW}Please stop the service using port $port and try again${NC}"
        exit 1
    fi
}

# Function to start backend
start_backend() {
    echo -e "${BLUE}🔧 Starting Backend (Port 5201)...${NC}"
    cd back
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
        npm install
    fi
    
    # Check if Prisma client is generated
    if [ ! -d "../node_modules/@prisma/client" ]; then
        echo -e "${YELLOW}🔧 Generating Prisma client...${NC}"
        npx prisma generate
    fi
    
    # Set environment variables
    export PORT=5201
    export NODE_ENV=development
    
    echo -e "${GREEN}✅ Backend starting on http://localhost:5201${NC}"
    npm run start:dev &
    BACKEND_PID=$!
    cd ..
}

# Function to start frontend
start_frontend() {
    echo -e "${BLUE}🎨 Starting Frontend (Port 5200)...${NC}"
    cd front
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
        npm install
    fi
    
    # Set environment variables
    export PORT=5200
    export NEXT_PUBLIC_API_URL=http://localhost:5201
    
    echo -e "${GREEN}✅ Frontend starting on http://localhost:5200${NC}"
    npm run dev &
    FRONTEND_PID=$!
    cd ..
}

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo -e "${GREEN}✅ Backend stopped${NC}"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo -e "${GREEN}✅ Frontend stopped${NC}"
    fi
    echo -e "${GREEN}👋 All services stopped${NC}"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if ports are available
echo -e "${YELLOW}🔍 Checking port availability...${NC}"
check_port 5200
check_port 5201

# Start services
start_backend
sleep 3  # Give backend time to start
start_frontend

echo -e "\n${GREEN}🎉 All services started successfully!${NC}"
echo -e "${BLUE}📱 Frontend: http://localhost:5200${NC}"
echo -e "${BLUE}🔧 Backend:  http://localhost:5201${NC}"
echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}"

# Wait for user to stop services
wait
