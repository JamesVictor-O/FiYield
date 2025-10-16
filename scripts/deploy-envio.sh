#!/bin/bash

# ===========================================
# NEXYIELD ENVIO DEPLOYMENT SCRIPT
# ===========================================
# Deploy Envio indexer for hackathon winning integration

set -e

echo "🚀 Deploying NexYield Envio Indexer..."
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

echo "🔧 Configuring environment..."
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cat > .env << EOF
# Envio Configuration
ENVIO_GRAPHQL_ENDPOINT=http://localhost:8080/graphql
ENVIO_WEBSOCKET_ENDPOINT=ws://localhost:8080/graphql
ENVIO_DATABASE_URL=postgresql://localhost:5432/envio
ENVIO_RPC_URL=https://testnet-rpc.monad.xyz
ENVIO_CHAIN_ID=10143
EOF
fi

echo "🚀 Starting Envio indexer..."
echo "Indexer will start on http://localhost:8080"
echo "GraphQL endpoint: http://localhost:8080/graphql"
echo "WebSocket endpoint: ws://localhost:8080/graphql"
echo ""
echo "Press Ctrl+C to stop the indexer"
echo ""

# Start the indexer
pnpm run start









