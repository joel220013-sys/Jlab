#!/usr/bin/env bash
# ==============================================================================
# PulseLab OS - Automated Production Deployment Script
# Targets: Ubuntu 22.04 / 24.04 LTS, Debian 12, or any Linux VPS
# ==============================================================================

set -e

echo "=========================================================="
echo "   🏥 PulseLab OS - Real World Production Deployment      "
echo "=========================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "📦 Docker not found. Installing Docker & Docker Compose..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    echo "✅ Docker installed successfully."
fi

# Check if Docker Compose plugin is installed
if ! docker compose version &> /dev/null; then
    echo "📦 Installing docker-compose-plugin..."
    sudo apt-get update && sudo apt-get install -y docker-compose-plugin
fi

# Ensure .env exists
if [ ! -f .env ]; then
    echo "⚙️ Creating .env from .env.example..."
    cp .env.example .env
    # Generate random secret key
    SECRET=$(openssl rand -hex 24 2>/dev/null || date +%s | sha256sum | base64 | head -c 32)
    sed -i "s/generate_a_random_32_character_secret_here/$SECRET/g" .env
    echo "🔑 Generated random SECRET_KEY in .env"
fi

echo "🚀 Building and starting PulseLab OS containers..."
docker compose down || true
docker compose build --pull
docker compose up -d

echo ""
echo "=========================================================="
echo "🎉 PulseLab OS is now LIVE and running in production!"
echo "=========================================================="
echo "🌐 Web Application: http://YOUR_SERVER_IP (or your domain)"
echo "🔐 Staff Login:     http://YOUR_SERVER_IP/login"
echo "🛠️ Admin Portal:    http://YOUR_SERVER_IP/admin/provisioning (PIN: 7899 or 7899514777)"
echo "🔌 API Docs:        http://YOUR_SERVER_IP/api/v1/docs"
echo "=========================================================="
echo "To view live logs: docker compose logs -f"
echo "To restart:        docker compose restart"
echo "To stop:           docker compose down"
echo "=========================================================="
