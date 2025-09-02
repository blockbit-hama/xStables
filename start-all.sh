#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${GREEN}Starting xStables Services...${NC}"
echo "================================"

# Kill any existing processes on ports 5000 and 5001
echo -e "${YELLOW}Cleaning up ports 5000 and 5001...${NC}"
lsof -ti:5000 | xargs kill -9 2>/dev/null
lsof -ti:5001 | xargs kill -9 2>/dev/null

# Check and install dependencies at root level (workspace)
cd "$SCRIPT_DIR"
if [ ! -d "node_modules" ] || [ ! -d "stable-back/node_modules" ] || [ ! -d "stable-front/node_modules" ]; then
    echo -e "${YELLOW}Installing workspace dependencies...${NC}"
    npm install --force
else
    echo -e "${GREEN}Dependencies already installed${NC}"
fi

# Start backend with PORT=5000
echo -e "${GREEN}Starting Backend on port 5000...${NC}"
cd "$SCRIPT_DIR/stable-back"
PORT=5000 npm run dev &
BACKEND_PID=$!
echo -e "Backend PID: ${BACKEND_PID}"

# Wait for backend to start
sleep 3

# Start frontend with PORT=5001
echo -e "${GREEN}Starting Frontend on port 5001...${NC}"
cd "$SCRIPT_DIR/stable-front"
PORT=5001 npm run dev &
FRONTEND_PID=$!
echo -e "Frontend PID: ${FRONTEND_PID}"

echo "================================"
echo -e "${GREEN}Services Started Successfully!${NC}"
echo -e "Backend: http://localhost:5000"
echo -e "Frontend: http://localhost:5001"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Function to handle shutdown
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down services...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    lsof -ti:5000 | xargs kill -9 2>/dev/null
    lsof -ti:5001 | xargs kill -9 2>/dev/null
    echo -e "${GREEN}Services stopped successfully${NC}"
    exit 0
}

# Set up trap to catch Ctrl+C
trap cleanup INT

# Keep script running
wait