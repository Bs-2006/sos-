#!/bin/bash

# LifeLink Development Startup Script

echo "🚀 Starting LifeLink Development Environment..."

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first."
    echo "   Run: mongod --dbpath /path/to/data"
    exit 1
fi

# Start Backend API
echo "🔧 Starting Backend API..."
cd backend
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Start Mobile App
echo "📱 Starting Mobile App..."
cd mobile
if [ ! -d "node_modules" ]; then
    echo "Installing mobile dependencies..."
    npm install
fi
npm start &
MOBILE_PID=$!
cd ..

echo ""
echo "✅ All services started!"
echo ""
echo "🔧 Backend API:   http://localhost:3000"
echo "📱 Mobile App:    Check Expo DevTools"
echo ""
echo "Press Ctrl+C to stop all services"

# Trap Ctrl+C and cleanup
trap "echo ''; echo '🛑 Stopping all services...'; kill $BACKEND_PID $MOBILE_PID 2>/dev/null; exit" INT

# Wait for all processes
wait
