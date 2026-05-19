#!/bin/bash
# OSneakers deploy script — pulls latest from GitHub, rebuilds, restarts.
# Usage: ssh into VPS, then run `~/osneakers/deploy/deploy.sh`

set -e

REPO_DIR="$HOME/osneakers"
cd "$REPO_DIR"

echo "→ Pulling latest from GitHub..."
git pull --rebase

echo "→ Updating backend dependencies..."
cd "$REPO_DIR/backend"
source venv/bin/activate
pip install -q -r requirements.txt
deactivate

echo "→ Rebuilding frontend..."
cd "$REPO_DIR/frontend"
yarn install --frozen-lockfile
yarn build

echo "→ Restarting backend service..."
sudo systemctl restart osneakers-backend
sleep 2
sudo systemctl status osneakers-backend --no-pager | head -10

echo "→ Reloading Nginx..."
sudo systemctl reload nginx

echo ""
echo "✅ Deploy complete!"
echo "   Storefront: https://osneakers.net"
echo "   API health: https://osneakers.net/api/"
