# Hostinger Deployment Guide (VPS)

This guide details how to deploy your **Meet App** (Node.js Backend + Frontend) to a **Hostinger VPS**.

**Note on Hostinger Horizons**: You mentioned "Hostinger Horizon". Hostinger Horizons is an AI-powered no-code website builder. Since you have a custom Node.js application, **Hostinger VPS** is the correct service to use for deployment.

---

## Prerequisites

1.  **Hostinger VPS Plan**: "KVM 1" or higher is recommended.
2.  **Domain Name**: (e.g., `your-app.com`).
3.  **SSH Client**: Terminal (Mac/Linux) or PuTTY/PowerShell (Windows).
4.  **MongoDB Atlas URI**: You already have this in your `.env`.

---

## Cost Evaluation (Estimated)

These estimates are based on Hostinger pricing (2025/2026). Prices may vary based on promotional periods and contract length.

### 1. Minimum Viable Setup (KVM 1)
*Best for development, testing, or very low traffic.*
- **VPS (KVM 1)**: ~$4.99/mo (introductory price for 24-48 month term)
  - *Renewal Price:* ~$8.99/mo
  - *Specs:* 1 vCPU, 4GB RAM, 50GB NVMe
- **Domain Name**: ~$10 - $15 / year (e.g., .com, .net, .online)
- **SSL Certificate**: Free (via Let's Encrypt)
- **Total Upfront**: ~$130 (for 2 years of hosting + domain)

### 2. Recommended Setup (KVM 2)
*Better for production apps with active users.*
- **VPS (KVM 2)**: ~$6.99/mo (introductory price for 24-48 month term)
  - *Renewal Price:* ~$10.99/mo
  - *Specs:* 2 vCPU, 8GB RAM, 100GB NVMe
- **Domain Name**: ~$10 - $15 / year
- **Total Upfront**: ~$180 (for 2 years of hosting + domain)

### 3. Other Potential Costs
- **Email Hosting**: Hostinger Business Email (~$1.50/mo) or Google Workspace (~$6/mo) if you need `support@your-domain.com`.
- **Daily Backups**: Weekly backups are usually included; daily backups may cost extra (~$2/mo).

---

## Step 1: Prepare the VPS

1.  **Log in to Hostinger hPanel** and go to **VPS**.
2.  Select your VPS and ensure the **Operating System** is **Ubuntu 22.04** or **24.04** (reinstall if necessary).
3.  Note your **VPS IP Address** and **Root Password**.

---

## Step 2: Connect via SSH

Open your local terminal (PowerShell or CMD on Windows) and run:

```bash
ssh root@<YOUR_VPS_IP>
```
*Enter your password when prompted.*

---

## Step 3: Install Dependencies

Run the following commands on your VPS to install Node.js, Nginx, and Git:

```bash
# 1. Update system
apt update && apt upgrade -y

# 2. Install Curl
apt install curl -y

# 3. Install Node.js (v20)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 4. Install Nginx (Web Server)
apt install nginx -y

# 5. Install Git
apt install git -y

# 6. Install PM2 (Process Manager to keep app running)
npm install -g pm2
```

---

## Step 4: Deploy the Backend

### 1. Clone Your Repository
*If your code is on GitHub/GitLab:*
```bash
cd /var/www
git clone <YOUR_GITHUB_REPO_URL> meet-app
cd meet-app/backend
```

*Alternatively, if you are uploading files manually:*
Use FileZilla (SFTP) to upload your project folder to `/var/www/meet-app`.

### 2. Setup Environment Variables
Create the `.env` file in the backend directory:

```bash
nano .env
```

Paste your `.env` content (Right-click to paste):

```env
JWT_SECRET=509ce6f70283b645c681d68f17425278d0cc8143818f80347cbf3ccbca4acd96
PORT=3001
MONGODB_URI=mongodb+srv://chantalenkembo01:zRS032G0aXJ0MEdQ@cluster-meetapp.6ot3ifl.mongodb.net/?appName=Cluster-meetapp
PAYPAL_CLIENT_ID=AUdBD5V3mny8aAASRLkSzuahGB9Nc3001sg7ZkBpdcfXjC8V7xPhIw4LT9vbVC4mCCCY5AjzivqFz_GM
PAYPAL_CLIENT_SECRET=EHGVy6kp6DC3ReKFUm5uTPFrbtoh0ckWL_Ag45fIh86qEkl1gpzaTGmatnczdtfoSw1xuIHtmSNgd5w3
PAYPAL_MODE=live
# Add your LemonSqueezy keys here as well
```

Press `Ctrl+X`, then `Y`, then `Enter` to save.

### 3. Install & Build
```bash
npm install
npm run build
```

### 4. Start the Backend with PM2
```bash
pm2 start dist/index.js --name "meet-backend"
pm2 save
pm2 startup
```
*(Run the command displayed by `pm2 startup` if asked).*

---

## Step 5: Deploy the Frontend

*Assuming you have a Frontend folder (e.g., `frontend` or `client`).*

1.  **On your Local Machine**, build the frontend:
    ```bash
    cd frontend
    npm install
    npm run build
    ```
    *This usually creates a `dist` or `build` folder.*

2.  **Upload the Build Files**:
    Use FileZilla (SFTP) to upload the **contents** of your local `dist` (or `build`) folder to `/var/www/meet-app/frontend/dist` on the VPS.

    *Note: Create the directory first on VPS:*
    ```bash
    mkdir -p /var/www/meet-app/frontend/dist
    ```

---

## Step 6: Configure Nginx (Reverse Proxy)

We need to tell Nginx to serve the Frontend files and forward API requests to the Backend.

1.  Create a configuration file:
    ```bash
    nano /etc/nginx/sites-available/meet-app
    ```

2.  Paste the following configuration (Replace `your-domain.com` with your actual domain):

    ```nginx
    server {
        listen 80;
        server_name your-domain.com www.your-domain.com;

        # Frontend (Static Files)
        location / {
            root /var/www/meet-app/frontend/dist;
            index index.html;
            try_files $uri $uri/ /index.html;
        }

        # Backend (API Proxy)
        location /api/ {
            proxy_pass http://localhost:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

3.  Enable the site:
    ```bash
    ln -s /etc/nginx/sites-available/meet-app /etc/nginx/sites-enabled/
    rm /etc/nginx/sites-enabled/default  # Remove default page
    nginx -t  # Test configuration
    systemctl restart nginx
    ```

---

## Step 7: Setup Domain & SSL (HTTPS)

1.  **Point Domain**: Go to your Domain Registrar (e.g., Namecheap, Hostinger) and add an **A Record** pointing to your VPS IP Address.
2.  **Install Certbot (SSL)**:
    ```bash
    apt install certbot python3-certbot-nginx -y
    certbot --nginx -d your-domain.com -d www.your-domain.com
    ```
3.  Follow the prompts to enable HTTPS redirect.

---

## Summary

- **Backend** is running on port 3001 (managed by PM2).
- **Nginx** is serving the Frontend files and forwarding `/api` calls to the Backend.
- **SSL** is secured via Let's Encrypt.

Your app should now be live at `https://your-domain.com`!
