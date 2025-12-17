# Environment Variables Guide

## Overview

Environment variables are configuration settings that control how your application behaves. They're stored in `.env` files and are loaded when the application starts.

This project uses environment variables for:
- **Authentication**: JWT token signing and verification
- **LiveKit Integration**: Video conferencing configuration
- **Database**: User data storage
- **Server Configuration**: Port and URL settings

---

## Frontend Environment Variables

**Location**: `.env.local` (in the project root)

### Required Settings

#### `LIVEKIT_API_KEY`
- **What it is**: API key for LiveKit Cloud
- **Where to get it**: [LiveKit Cloud Dashboard](https://cloud.livekit.io)
- **How to use**: Used by backend to generate video conference tokens
- **Example**: `LIVEKIT_API_KEY=APIa4EUsjbpb67M`
- **Current value**: `APIovXr9WtsG57H` (from your LiveKit Cloud project)

#### `LIVEKIT_API_SECRET`
- **What it is**: Secret key paired with LIVEKIT_API_KEY
- **Where to get it**: [LiveKit Cloud Dashboard](https://cloud.livekit.io) (same place as API key)
- **How to use**: Used with API key to authenticate LiveKit API requests
- **Example**: `LIVEKIT_API_SECRET=RnsGB4IRmgQLWV74WtpOIYixzYnagW9NAt1W43z9R6L`
- **Current value**: `RnsGB4IRmgQLWV74WtpOIYixzYnagW9NAt1W43z9R6L`
- **⚠️ Security**: Keep this secret! Never commit to version control.

#### `LIVEKIT_URL`
- **What it is**: WebSocket URL to your LiveKit server
- **Where to get it**: [LiveKit Cloud Dashboard](https://cloud.livekit.io)
- **How to use**: Tells the frontend where to connect for video conferencing
- **Format**: `wss://your-project-id.livekit.cloud`
- **Example**: `LIVEKIT_URL=wss://streamo-unsm3ks8.livekit.cloud`
- **Current value**: `wss://meetapp-oh0ezfjo.livekit.cloud`

#### `JWT_SECRET`
- **What it is**: Secret key used to sign and verify JWT authentication tokens
- **How to use**: Used for user login/authentication
- **Format**: Random string (at least 32 characters recommended)
- **How to generate**:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **Example**: `JWT_SECRET=a7f3e9c2b1d4f6e8c0a2b4d6f8e0c2a4b6d8e0f2a4c6d8e0f2a4b6c8d0e2`
- **Current value**: `your-super-secret-key` (development default)
- **⚠️ Production**: Change this to a secure random value!

### Optional Settings

#### `NEXT_PUBLIC_SHOW_SETTINGS_MENU`
- **What it is**: Shows settings menu in video conference
- **Valid values**: `true` or `false`
- **Default**: `false`
- **Example**: `NEXT_PUBLIC_SHOW_SETTINGS_MENU=true`
- **Note**: Requires LiveKit Cloud for some features like Krisp noise filters

#### `NEXT_PUBLIC_LK_RECORD_ENDPOINT`
- **What it is**: API endpoint for recording video conferences
- **Default**: `/api/record`
- **Example**: `NEXT_PUBLIC_LK_RECORD_ENDPOINT=/api/record`

#### `NEXT_PUBLIC_CONN_DETAILS_ENDPOINT`
- **What it is**: API endpoint for getting connection details
- **Default**: `/api/connection-details`
- **Example**: `NEXT_PUBLIC_CONN_DETAILS_ENDPOINT=/api/connection-details`

#### `NEXT_PUBLIC_DATADOG_CLIENT_TOKEN`
- **What it is**: Datadog client token for logging
- **Where to get it**: [Datadog Dashboard](https://app.datadoghq.com)
- **Example**: `NEXT_PUBLIC_DATADOG_CLIENT_TOKEN=client-token`

#### `NEXT_PUBLIC_DATADOG_SITE`
- **What it is**: Datadog site for logging
- **Valid values**: `datadoghq.com`, `us3.datadoghq.com`, etc.
- **Example**: `NEXT_PUBLIC_DATADOG_SITE=datadoghq.com`

### Recording Settings (Optional)

For S3 recording integration:

#### `S3_KEY_ID`
- **What it is**: AWS S3 access key ID
- **Where to get it**: AWS Console

#### `S3_KEY_SECRET`
- **What it is**: AWS S3 secret access key
- **Where to get it**: AWS Console

#### `S3_ENDPOINT`
- **What it is**: S3 endpoint URL
- **Example**: `https://s3.amazonaws.com`

#### `S3_BUCKET`
- **What it is**: S3 bucket name for recordings
- **Example**: `my-recordings-bucket`

#### `S3_REGION`
- **What it is**: AWS region for S3 bucket
- **Example**: `us-east-1`

---

## Backend Environment Variables

**Location**: `backend/.env`

### Required Settings

#### `JWT_SECRET`
- **What it is**: Secret key for signing JWT tokens during login
- **How to use**: Verifies user authentication tokens
- **Format**: Random string (must match frontend JWT_SECRET)
- **How to generate**:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- **Example**: `JWT_SECRET=a7f3e9c2b1d4f6e8c0a2b4d6f8e0c2a4b6d8e0f2a4c6d8e0f2a4b6c8d0e2`
- **Current value**: `your-super-secret-key` (development default)
- **⚠️ Important**: Must match the frontend JWT_SECRET for token verification!

#### `DATABASE_URL`
- **What it is**: Path to the database file
- **How to use**: Stores user accounts and credentials
- **Format**: File path (can be relative or absolute)
- **Example**: `DATABASE_URL=db.json`
- **Current value**: `db.json`
- **Note**: Uses lowdb (lightweight JSON database)

#### `PORT`
- **What it is**: Port number for the backend server
- **Default**: `3001`
- **Example**: `PORT=3001`
- **Current value**: `3001`

---

## How to Setup

### Step 1: Create LiveKit Cloud Account
1. Go to [LiveKit Cloud](https://cloud.livekit.io)
2. Create a new project
3. Copy the API Key, Secret, and URL

### Step 2: Configure Frontend (.env.local)
```bash
# Required for video conferencing
LIVEKIT_API_KEY=your_api_key_here
LIVEKIT_API_SECRET=your_api_secret_here
LIVEKIT_URL=wss://your-project.livekit.cloud

# Authentication
JWT_SECRET=your-super-secret-key
```

### Step 3: Configure Backend (backend/.env)
```bash
# Authentication (must match frontend)
JWT_SECRET=your-super-secret-key

# Database
DATABASE_URL=db.json

# Server
PORT=3001
```

### Step 4: Start the Application

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
# Server runs on http://localhost:3001
```

**Terminal 2 - Frontend**:
```bash
pnpm dev
# Application runs on http://localhost:3000
```

---

## Security Best Practices

### ⚠️ DO NOT
- ❌ Commit `.env` files to Git
- ❌ Share `LIVEKIT_API_SECRET` or `JWT_SECRET` publicly
- ❌ Use default/placeholder values in production
- ❌ Commit sensitive keys to version control

### ✅ DO
- ✅ Use `.gitignore` to exclude `.env*` files
- ✅ Generate secure random secrets with `crypto.randomBytes()`
- ✅ Store secrets in environment management service (AWS Secrets Manager, etc.)
- ✅ Rotate secrets regularly
- ✅ Use different secrets for development and production

### Example `.gitignore`
```
.env
.env.local
.env.*.local
backend/.env
```

---

## Environment Variable Naming Conventions

### `NEXT_PUBLIC_*` Variables
- **Visible**: Yes, exposed to browser/client
- **Use case**: Non-sensitive configuration (URLs, feature flags)
- **Examples**: `NEXT_PUBLIC_SHOW_SETTINGS_MENU`, `NEXT_PUBLIC_DATADOG_CLIENT_TOKEN`

### Regular Variables (No Prefix)
- **Visible**: No, server-side only
- **Use case**: Sensitive data (secrets, API keys)
- **Examples**: `LIVEKIT_API_SECRET`, `JWT_SECRET`, `DATABASE_URL`

---

## Common Issues and Solutions

### Issue: "401 Unauthorized" Error
- **Cause**: Missing or invalid JWT token
- **Solution**: Ensure `JWT_SECRET` matches between frontend and backend
- **Check**: Both `.env.local` and `backend/.env` have the same JWT_SECRET value

### Issue: "403 Forbidden" Error
- **Cause**: JWT token verification failed
- **Solution**: 
  1. Check JWT_SECRET is correct in both files
  2. Verify token contains `id` and `username` claims
  3. Check token hasn't expired

### Issue: "WebSocket connection failed" in Video Conference
- **Cause**: Invalid LiveKit URL or credentials
- **Solution**:
  1. Verify `LIVEKIT_URL` is correct from LiveKit Cloud
  2. Check `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` are correct
  3. Ensure LiveKit Cloud project is active

### Issue: "Cannot connect to backend"
- **Cause**: Backend server not running or PORT is wrong
- **Solution**:
  1. Start backend: `cd backend && npm run dev`
  2. Verify PORT is 3001
  3. Check backend server is listening on `http://localhost:3001`

---

## Environment Variable Reference

| Variable | Required | Backend | Frontend | Type | Default |
|----------|----------|---------|----------|------|---------|
| JWT_SECRET | ✅ | ✅ | ✅ | String | `your-super-secret-key` |
| LIVEKIT_API_KEY | ✅ | - | ✅ | String | - |
| LIVEKIT_API_SECRET | ✅ | - | ✅ | String | - |
| LIVEKIT_URL | ✅ | - | ✅ | URL | - |
| DATABASE_URL | ✅ | ✅ | - | File Path | `db.json` |
| PORT | - | ✅ | - | Number | `3001` |
| NEXT_PUBLIC_SHOW_SETTINGS_MENU | - | - | ✅ | Boolean | `false` |
| NEXT_PUBLIC_LK_RECORD_ENDPOINT | - | - | ✅ | String | `/api/record` |
| S3_KEY_ID | - | - | ✅ | String | - |
| S3_KEY_SECRET | - | - | ✅ | String | - |

---

## Next Steps

1. ✅ Configure both `.env.local` and `backend/.env`
2. ✅ Start both backend and frontend servers
3. ✅ Create an account at `http://localhost:3000/login`
4. ✅ Join a video conference room at `http://localhost:3000/rooms/test-room`

For more help, see the [README.md](README.md) file.


What's running:
Service	URL	Status
Backend API	http://localhost:3001	✅ Running
Frontend UI	http://localhost:3000	✅ Running
LiveKit Cloud	wss://meetapp-oh0ezfjo.livekit.cloud	✅ Connected