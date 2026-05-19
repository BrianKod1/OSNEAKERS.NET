# OSneakers — Hostinger Deployment Guide

Production-ready deployment guide for the OSneakers full-stack app on a Hostinger VPS.

## 📦 Stack
- **Frontend:** React (Create React App) + Tailwind + Shadcn UI
- **Backend:** FastAPI (Python 3.11+) + Motor (async MongoDB driver) + APScheduler
- **Database:** MongoDB Atlas (free M0 tier)
- **Email:** Resend (verified domain `osneakers.net`)
- **Reverse proxy:** Nginx with Certbot SSL

---

## 🚀 Prerequisites

- ✅ Hostinger VPS — minimum **KVM 1** (~$5–8/mo). Ubuntu 22.04 LTS recommended.
- ✅ MongoDB Atlas cluster created with restored data (see `MIGRATION.md`)
- ✅ Domain (`osneakers.net`) DNS pointed at your VPS IP
- ✅ Resend API key + verified `noreply@osneakers.net` sender

---

## 1️⃣ Initial VPS Setup

SSH into your VPS as `root`:

```bash
ssh root@YOUR_VPS_IP
```

Update + install system dependencies:

```bash
apt update && apt upgrade -y
apt install -y python3.11 python3.11-venv python3-pip nginx git curl ufw certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g yarn
```

Enable firewall:
```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

Create a non-root user (recommended):
```bash
adduser osneakers
usermod -aG sudo osneakers
su - osneakers
```

---

## 2️⃣ Clone the repo

```bash
cd ~
git clone https://github.com/YOUR_GITHUB_USERNAME/osneakers.git
cd osneakers
```

---

## 3️⃣ Backend setup

```bash
cd ~/osneakers/backend
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn
```

Create `backend/.env` with production values:

```env
MONGO_URL=mongodb+srv://Osneakers:YOUR_NEW_ATLAS_PASSWORD@cluster0.phtptzo.mongodb.net/?appName=Cluster0
DB_NAME=osneakers
CORS_ORIGINS=https://osneakers.net,https://www.osneakers.net
RESEND_API_KEY=re_YOUR_RESEND_API_KEY
SENDER_EMAIL=noreply@osneakers.net
DISCOUNT_CODE=SNEAK10
DISCOUNT_PERCENT=10
ADMIN_PASSCODE=osneakers-admin-2026
STORE_URL=https://osneakers.net
```

Test the backend boots:
```bash
gunicorn -w 2 -k uvicorn.workers.UvicornWorker server:app --bind 127.0.0.1:8001 --timeout 60
```

Visit `http://YOUR_VPS_IP:8001/api/` — you should see `{"message":"OSneakers API","version":"1.0"}`. Press `Ctrl+C` to stop.

---

## 4️⃣ Run backend as a systemd service

Create `/etc/systemd/system/osneakers-backend.service`:

```ini
[Unit]
Description=OSneakers FastAPI backend
After=network.target

[Service]
Type=simple
User=osneakers
WorkingDirectory=/home/osneakers/osneakers/backend
Environment="PATH=/home/osneakers/osneakers/backend/venv/bin"
ExecStart=/home/osneakers/osneakers/backend/venv/bin/gunicorn -w 2 -k uvicorn.workers.UvicornWorker server:app --bind 127.0.0.1:8001 --timeout 60
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable + start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now osneakers-backend
sudo systemctl status osneakers-backend
```

---

## 5️⃣ Frontend build

```bash
cd ~/osneakers/frontend
```

Create `frontend/.env.production`:
```env
REACT_APP_BACKEND_URL=https://osneakers.net
```

Build static assets:
```bash
yarn install
yarn build
```

Output goes to `~/osneakers/frontend/build/`.

---

## 6️⃣ Nginx config

Copy `nginx.conf` from the repo:

```bash
sudo cp ~/osneakers/deploy/nginx.conf /etc/nginx/sites-available/osneakers
sudo ln -sf /etc/nginx/sites-available/osneakers /etc/nginx/sites-enabled/osneakers
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7️⃣ SSL with Certbot (free, auto-renews)

```bash
sudo certbot --nginx -d osneakers.net -d www.osneakers.net
```

Follow the prompts. Certbot auto-edits your Nginx config to redirect HTTP → HTTPS. Done.

---

## 8️⃣ Verify everything works

- 🌐 https://osneakers.net — storefront loads
- 🔌 https://osneakers.net/api/ — returns `{"message":"OSneakers API","version":"1.0"}`
- 🛒 https://osneakers.net/catalog — 21 products visible
- 📧 Subscribe with a test email — confirm the welcome email lands

---

## 🔄 Deploying updates later

After pushing changes to GitHub:
```bash
cd ~/osneakers
git pull
# Backend changes
cd backend && source venv/bin/activate && pip install -r requirements.txt && sudo systemctl restart osneakers-backend
# Frontend changes
cd ../frontend && yarn install && yarn build
sudo systemctl reload nginx
```

Or just run `~/osneakers/deploy/deploy.sh` (provided script does all of the above).

---

## ⚠️ Common gotchas

| Problem | Fix |
|---|---|
| `502 Bad Gateway` from Nginx | Backend not running. `sudo systemctl status osneakers-backend` and check logs with `journalctl -u osneakers-backend -n 50` |
| CORS errors in browser console | Make sure `CORS_ORIGINS` in backend/.env includes your final domain (both `osneakers.net` and `www.osneakers.net`) |
| `/api/` works but the storefront doesn't load products | `REACT_APP_BACKEND_URL` in `.env.production` is wrong, OR you didn't rebuild after changing it |
| MongoDB connection times out | Atlas Network Access doesn't include your VPS IP. Add it: Atlas → Network Access → Add IP Address → enter VPS IP |
| Scheduled jobs (digest, credit reminder) not firing | APScheduler runs inside the FastAPI process; `systemctl restart osneakers-backend` re-arms them |
