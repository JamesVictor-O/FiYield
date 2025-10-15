#!/bin/bash

# ===========================================
# NEXYIELD ENVIO STARTUP SCRIPT
# ===========================================
# Start Envio indexer for hackathon demo

set -e

echo "🚀 Starting NexYield Envio Indexer..."
echo "======================================"

# Check if we're in the right directory
if [ ! -d "Envio" ]; then
    echo "❌ Error: Envio directory not found!"
    echo "Please run this script from the NexYield root directory"
    exit 1
fi

cd Envio

echo "📦 Installing dependencies..."
pnpm install

echo "🔨 Building indexer..."
pnpm run build

echo "🚀 Starting Envio indexer..."
echo ""
echo "✅ Envio indexer is starting..."
echo "📊 GraphQL endpoint: http://localhost:8080/graphql"
echo "🔗 WebSocket endpoint: ws://localhost:8080/graphql"
echo ""
echo "Press Ctrl+C to stop the indexer"
echo ""

# Start the indexer
pnpm run start
