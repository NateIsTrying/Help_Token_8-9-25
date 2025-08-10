#!/bin/bash
echo "🚀 Starting HelpToken development servers..."

# Start backend in background
cd backend
npm run dev &
BACKEND_PID=$!

# Start frontend in background  
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ Servers started!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:8000"
echo "Press Ctrl+C to stop all servers"

# Wait for Ctrl+C
trap "echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait