#!/bin/bash

# Start Qdrant using Docker Compose
echo "🚀 Starting Qdrant vector database..."
docker-compose -f docker-compose.qdrant.yml up -d

# Wait for Qdrant to be ready
echo "⏳ Waiting for Qdrant to be ready..."
sleep 3

# Check if Qdrant is running
if curl -s http://localhost:6333/ > /dev/null; then
    echo "✅ Qdrant is running!"
    echo "📊 Dashboard: http://localhost:6333/dashboard"
    echo "🔌 API: http://localhost:6333"
else
    echo "❌ Qdrant failed to start. Check logs with:"
    echo "   docker-compose -f docker-compose.qdrant.yml logs"
fi
