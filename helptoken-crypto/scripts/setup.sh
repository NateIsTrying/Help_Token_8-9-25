#!/bin/bash
echo "🤝 Setting up HelpToken Municipal Cryptocurrency..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

echo "📦 Installing frontend dependencies..."
cd frontend && npm install && cd ..

echo "📦 Installing backend dependencies..."
cd backend && npm install && cd ..

echo "⚙️ Setting up environment files..."
if [ ! -f frontend/.env.local ]; then
    touch frontend/.env.local
    echo "NEXT_PUBLIC_API_URL=http://localhost:8000" >> frontend/.env.local
    echo "✅ Created frontend/.env.local"
fi

if [ ! -f backend/.env ]; then
    touch backend/.env
    echo "NODE_ENV=development" >> backend/.env
    echo "PORT=8000" >> backend/.env
    echo "DATABASE_URL=postgresql://username:password@localhost:5432/helptoken" >> backend/.env
    echo "JWT_SECRET=your_jwt_secret_here" >> backend/.env
    echo "✅ Created backend/.env"
fi

mkdir -p backend/logs

echo "✅ Setup complete!"
echo "Next steps:"
echo "1. Edit frontend/.env.local and backend/.env with your values"
echo "2. Start development: ./scripts/dev.sh"
