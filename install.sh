#!/bin/bash
echo "========================================"
echo "   Lyra Stack for Hermes Agent Setup    "
echo "========================================"

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "[!] Docker is not installed. Please install Docker first."
    exit 1
fi

echo "[1] Pulling Lyra Stack..."
git clone https://github.com/your-username/lyra-stack.git ~/.lyra-stack
cd ~/.lyra-stack

echo "[2] Setting up environment..."
cp .env.example .env
echo "Please edit ~/.lyra-stack/.env to add your API Keys."

echo "[3] Starting services..."
docker-compose up -d

echo ""
echo "========================================"
echo "Lyra Stack is running!"
echo "- 9Router Proxy: http://127.0.0.1:20128"
echo "- Memory Core V2: http://127.0.0.1:20129"
echo ""
echo "To connect Hermes Agent, edit your ~/.hermes/config.yaml:"
echo "provider: custom"
echo "model: hermes-agent"
echo "base_url: http://127.0.0.1:20128/v1"
echo "========================================"
