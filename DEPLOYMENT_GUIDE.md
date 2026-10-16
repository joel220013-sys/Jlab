# 🏥 PulseLab OS - Real World Production Deployment Guide

This guide provides everything you need to deploy **PulseLab OS** (Next.js Frontend + FastAPI Backend + Nginx Gateway) to a live public server with custom domains, free HTTPS/SSL, and automatic restarts.

---

## ⚡ Method 1: Single Cloud VPS with Docker (Recommended)
> **Best for:** Most diagnostic software businesses. Cost: ~$4 - $10/month (₹350 - ₹800/mo) on **Hostinger, DigitalOcean, Hetzner, AWS Lightsail/EC2, or Linode**.

### Step 1: Get an Ubuntu VPS
1. Create a VPS with **Ubuntu 22.04 LTS or 24.04 LTS** (minimum 2 GB RAM, 1-2 vCPUs, 25GB SSD).
2. Connect to your server via SSH:
   ```bash
   ssh root@YOUR_SERVER_IP
   ```

### Step 2: Upload Your Code to the Server
You can either push your project to a private GitHub repo and clone it, or upload it directly:
```bash
# Option A: Git Clone
git clone https://github.com/YOUR_USERNAME/pulselab.git /var/www/pulselab
cd /var/www/pulselab

# Option B: Upload directly from Windows using SCP (from your local PowerShell)
# scp -r c:\Users\User\Downloads\blood root@YOUR_SERVER_IP:/var/www/pulselab
```

### Step 3: Run the 1-Click Deployment Script
Inside `/var/www/pulselab`, run:
```bash
chmod +x deploy.sh
./deploy.sh
```
The script will automatically:
- Install Docker and Docker Compose (if not already installed).
- Generate a cryptographically secure `SECRET_KEY` in `.env`.
- Build the optimized Next.js standalone container.
- Build the FastAPI Gunicorn container with 4 concurrent workers.
- Launch the Nginx Gateway routing all requests over port 80.

Your software is now immediately live at `http://YOUR_SERVER_IP`!

---

## 🔒 Step 4: Connect Your Domain & Free SSL (HTTPS)

### 1. Point Your Domain DNS
Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, Hostinger):
- Create an **A Record**:
  - **Host:** `@` (or `lab` for `lab.yourdomain.com`)
  - **Points to / Value:** `YOUR_SERVER_IP`

### 2. Enable HTTPS via Free Let's Encrypt SSL
Run this on your Ubuntu VPS:
```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```
Then mount the certificate into `docker-compose.yml` or use Cloudflare Free SSL with Proxy (`Full (Strict)`), which gives you instant zero-config SSL and DDoS protection!

---

## ☁️ Method 2: Cloud Managed Hosting (Vercel + Render / Railway)
> **Best if:** You do not want to manage a Linux server.

### 1. Deploy Backend on Render / Railway
1. Sign up on [Render.com](https://render.com) or [Railway.app](https://railway.app).
2. Click **New Web Service** and select your GitHub repository.
3. Configure the backend service:
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 4`
   - **Environment Variables:**
     - `SECRET_KEY`: (Enter a random 32-character key)
     - `DATABASE_URL`: `sqlite:///app/pulselab.db` (or attach a free PostgreSQL database from Render / Supabase)
4. Click **Deploy**. You will get a backend URL like `https://pulselab-api.onrender.com`.

### 2. Deploy Frontend on Vercel
1. Sign up on [Vercel.com](https://vercel.com) and import your repository.
2. Configure project settings:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `frontend`
   - **Environment Variables:**
     - `NEXT_PUBLIC_API_URL`: `https://pulselab-api.onrender.com/api/v1`
3. Click **Deploy**. Vercel will build and assign you a global HTTPS domain (e.g., `https://pulselab.vercel.app`).

---

## 🛠️ Operating in the Real World (Client Management)

### How to Create Accounts for New Paying Clients:
1. When a client buys a license, navigate to your private provisioning URL:
   ```text
   https://yourdomain.com/admin/provisioning
   ```
2. Enter your Master PIN: `7899` (or `7899514777`)
3. Fill in:
   - **Lab Name:** (e.g. *Dr. Sharma Diagnostic Center*)
   - **Plan:** Basic, Professional, or Enterprise
   - **Admin Username & Password:** (or click "Generate Strong Password")
   - **Auto-clone Catalog:** Checked (clones all 265 standard tests + 767 parameters)
4. Click **"Provision Laboratory & Generate Credentials"**.
5. Click **"Send Credentials via WhatsApp"** to instantly deliver the login URL, username, and password to the buyer's WhatsApp!

### How Clients Log In:
- Clients open `https://yourdomain.com/login` and log in with the credentials you provided them.
- They have access to their laboratory dashboard, patient registration, test entry, billing, and reports.

---

## 💾 Automatic Database Backups (Crucial for Real World)
To automatically back up your laboratory database every night at 2:00 AM on your VPS:
```bash
# Open crontab
crontab -e

# Add this line to create a timestamped backup daily:
0 2 * * * cp /var/www/pulselab/backend/pulselab.db /var/backups/pulselab_$(date +\%F).db
```

---

## 📋 Common Maintenance Commands
```bash
# Check running status
docker compose ps

# View live system logs
docker compose logs -f

# Restart services
docker compose restart

# Update to latest code
git pull
docker compose build
docker compose up -d
```
