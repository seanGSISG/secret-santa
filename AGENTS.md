# AI Installation Assistant

This file provides instructions for AI assistants (Claude Code, Gemini CLI, OpenAI Codex, etc.) to help users install and configure Secret Santa.

---

## Instructions for AI Assistants

When a user asks you to help install Secret Santa using this file, follow these steps in order. Use your tools to execute commands, create files, and interact with the user.

---

## Step 1: Greet and Explain Options

First, explain the installation options to the user and ask them to choose:

**Say to the user:**

> I'll help you install Secret Santa! There are three ways to set this up:
>
> **Option 1: Local Docker (Recommended for beginners)**
>
> - Runs on your computer
> - Your data stays private on your machine
> - Requires Docker Desktop installed
> - Access at http://localhost:3001
>
> **Option 2: Railway (Cloud - Easiest)**
>
> - Runs in the cloud, accessible from anywhere
> - Free tier available (with limits)
> - No software to install on your computer
> - Get a public URL automatically
>
> **Option 3: Render (Cloud - Also Easy)**
>
> - Similar to Railway, runs in the cloud
> - Free tier available
> - Includes persistent storage for database
>
> Which option would you like? (1, 2, or 3)

Wait for the user's response before proceeding.

---

## Step 2A: Local Docker Installation

If the user chose **Option 1 (Local Docker)**, follow these steps:

### 2A.1: Check Docker Installation

Run this command to check if Docker is installed:

```bash
docker --version
```

**If Docker is NOT installed**, tell the user:

> Docker is not installed on your system. Please install Docker Desktop first:
>
> - **Windows**: https://docs.docker.com/desktop/install/windows-install/
> - **Mac**: https://docs.docker.com/desktop/install/mac-install/
> - **Linux**: https://docs.docker.com/engine/install/
>
> After installing, open Docker Desktop and wait for it to start, then ask me to continue.

Wait for the user to confirm Docker is installed before proceeding.

### 2A.2: Check if Docker is Running

```bash
docker info > /dev/null 2>&1 && echo "Docker is running" || echo "Docker is not running"
```

If Docker is not running, tell the user to start Docker Desktop.

### 2A.3: Navigate to Project Directory

Confirm you're in the secret-santa directory:

```bash
pwd
ls -la docker-compose.yml
```

If not in the correct directory, navigate there or ask the user where they cloned/downloaded the project.

### 2A.4: Create Environment File

**Ask the user:**

> Now I need to set up your configuration. Do you want to enable email notifications?
>
> Email notifications will:
>
> - Send participants their Secret Santa match
> - Notify when someone adds to their wishlist
> - Send welcome emails to new users
>
> This requires a Gmail account with an App Password. Would you like to set this up? (yes/no)

**If user says YES to email:**

> To send emails, I need your Gmail credentials. You'll need a Gmail App Password (not your regular password).
>
> **To create an App Password:**
>
> 1. Go to https://myaccount.google.com/apppasswords
> 2. You may need to enable 2-Step Verification first at https://myaccount.google.com/security
> 3. Select "Mail" and "Other (Custom name)"
> 4. Type "Secret Santa" and click Generate
> 5. Copy the 16-character password
>
> What is your Gmail address?

Wait for email address.

> What is your Gmail App Password? (the 16-character code, spaces are okay)

Wait for app password.

**Create the .env file with email:**

```bash
cat > server/.env << 'ENVFILE'
NODE_ENV=production
PORT=3001
CLIENT_URL=http://localhost:3001
EMAIL_USER=<USER_PROVIDED_EMAIL>
EMAIL_PASS=<USER_PROVIDED_PASSWORD>
ENVFILE
```

Replace `<USER_PROVIDED_EMAIL>` and `<USER_PROVIDED_PASSWORD>` with the user's input. Remove spaces from the password.

**If user says NO to email:**

```bash
cat > server/.env << 'ENVFILE'
NODE_ENV=production
PORT=3001
CLIENT_URL=http://localhost:3001
# Email disabled - participants won't receive notifications
# EMAIL_USER=
# EMAIL_PASS=
ENVFILE
```

### 2A.5: Build and Start the Application

```bash
docker-compose up -d --build
```

Wait for the build to complete. This may take 2-3 minutes.

Check if it's running:

```bash
docker-compose ps
```

### 2A.6: Create Admin Account

**Tell the user:**

> The app is starting! Now let's create your admin account.
>
> What email address do you want for your admin account?

Wait for email.

> What name should I use for this account?

Wait for name.

> What password would you like? (at least 8 characters)

Wait for password.

Run the admin creation script interactively or create via direct database insert:

```bash
docker exec -it secret-santa bun scripts/create-admin.ts
```

If the interactive script doesn't work, provide manual instructions.

### 2A.7: Verify Installation

```bash
curl -s http://localhost:3001/api/health || echo "Waiting for server..."
```

**Tell the user:**

> 🎉 Secret Santa is now running!
>
> **Access your app:** http://localhost:3001
>
> **Your admin login:**
>
> - Email: <the email they provided>
> - Password: <the password they provided>
>
> **Next steps:**
>
> 1. Open http://localhost:3001 in your browser
> 2. Log in with your admin credentials
> 3. Go to the Admin tab to add family members
> 4. Once everyone is added, click "Generate Matches"
>
> **Useful commands:**
>
> - View logs: `docker-compose logs -f`
> - Stop the app: `docker-compose down`
> - Restart: `docker-compose restart`
>
> Would you like help sharing this with family members who are remote? I can help set up Cloudflare Tunnel or Tailscale.

---

## Step 2B: Railway Cloud Installation

If the user chose **Option 2 (Railway)**, follow these steps:

### 2B.1: Check for Railway CLI

```bash
railway --version
```

**If Railway CLI is not installed:**

> The Railway CLI is not installed. You have two options:
>
> **Option A: Use the web interface (easier)**
>
> 1. Go to https://railway.app
> 2. Sign up or log in with GitHub
> 3. Click "New Project" → "Deploy from GitHub repo"
> 4. Select your secret-santa repository
> 5. Railway will auto-detect the Dockerfile
>
> **Option B: Install the CLI**
>
> - **Mac:** `brew install railway`
> - **Windows/Linux:** `npm install -g @railway/cli`
>
> Which would you prefer?

For web interface, guide them through the UI. For CLI, continue below.

### 2B.2: Login to Railway

```bash
railway login
```

### 2B.3: Initialize and Deploy

```bash
railway init
railway up
```

### 2B.4: Set Environment Variables

**Ask the user for their email configuration (same as Step 2A.4)**

```bash
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set CLIENT_URL=<RAILWAY_PROVIDED_URL>
railway variables set EMAIL_USER=<USER_PROVIDED_EMAIL>
railway variables set EMAIL_PASS=<USER_PROVIDED_PASSWORD>
```

### 2B.5: Get the Deployment URL

```bash
railway open
```

**Tell the user their app URL and guide them to create an admin account via the Railway shell or web console.**

---

## Step 2C: Render Cloud Installation

If the user chose **Option 3 (Render)**, follow these steps:

### 2C.1: Guide to Render Dashboard

> Render doesn't have a CLI for deployments. Let me guide you through the web interface:
>
> 1. Go to https://render.com
> 2. Sign up or log in (GitHub login recommended)
> 3. Click "New +" → "Web Service"
> 4. Connect your GitHub account if not already connected
> 5. Select your secret-santa repository
> 6. Render will detect the Dockerfile automatically
>
> **Settings to configure:**
>
> - Name: `secret-santa`
> - Region: Choose closest to you
> - Instance Type: Free
>
> **Environment Variables to add:**
>
> - `NODE_ENV` = `production`
> - `PORT` = `3001`
> - `CLIENT_URL` = (Render will give you a URL like https://secret-santa-xxxx.onrender.com)
> - `EMAIL_USER` = (your Gmail)
> - `EMAIL_PASS` = (your App Password)
>
> Click "Create Web Service" to deploy.
>
> Want me to help you get your Gmail App Password?

---

## Step 3: Remote Access Setup (Optional)

If the user wants to share with remote family members and chose local Docker:

**Ask:**

> How would you like family members to access the app?
>
> **Option A: Cloudflare Tunnel (Recommended)**
>
> - Free, secure, hides your IP
> - Gets you a public URL
> - Requires a Cloudflare account
>
> **Option B: Tailscale**
>
> - Free, very secure
> - Everyone needs to install Tailscale
> - No public URL, private network only
>
> **Option C: Port Forwarding**
>
> - No extra software
> - Less secure, exposes your IP
> - Requires router configuration
>
> Which would you prefer? (A, B, or C)

### Step 3A: Cloudflare Tunnel

Check if cloudflared is installed:

```bash
cloudflared --version
```

If not installed, provide installation instructions:

- **Mac:** `brew install cloudflare/cloudflare/cloudflared`
- **Windows:** Direct them to https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
- **Linux:** `curl -L https://pkg.cloudflare.com/cloudflared-stable-linux-amd64.deb -o cloudflared.deb && sudo dpkg -i cloudflared.deb`

Then:

```bash
cloudflared tunnel --url http://localhost:3001
```

This gives a temporary public URL. For permanent setup, guide them through `cloudflared tunnel create`.

**Important:** Remind the user to update `CLIENT_URL` in `server/.env` with the Cloudflare URL, then restart:

```bash
docker-compose restart
```

### Step 3B: Tailscale

```bash
# Check if installed
tailscale --version
```

If not installed, direct to https://tailscale.com/download

```bash
tailscale up
tailscale ip -4
```

Tell user to share `http://<tailscale-ip>:3001` with family who also have Tailscale.

### Step 3C: Port Forwarding

Guide user to:

1. Find their local IP (`ifconfig` or `ipconfig`)
2. Access router admin (usually 192.168.1.1)
3. Forward port 3001
4. Find public IP (https://whatismyip.com)
5. Update CLIENT_URL and restart

---

## Troubleshooting Commands

If something goes wrong, use these diagnostic commands:

```bash
# Check if containers are running
docker-compose ps

# View logs
docker-compose logs -f

# Restart everything
docker-compose down && docker-compose up -d

# Check disk space
df -h

# Check if port 3001 is in use
lsof -i :3001 || netstat -an | grep 3001
```

---

## Summary Checklist

Before finishing, verify:

- [ ] Docker is installed and running (for local install)
- [ ] `server/.env` file exists with correct values
- [ ] Application is running (`docker-compose ps` shows healthy)
- [ ] Admin account has been created
- [ ] User can access the app in their browser
- [ ] Email is configured (optional but recommended)
- [ ] Remote access is set up (if requested)

**End the session by asking:**

> Is there anything else you'd like help with? For example:
>
> - Adding more users
> - Testing email notifications
> - Setting up a custom domain
> - Backing up your data
