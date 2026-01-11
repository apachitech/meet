# Deployment Guide (MongoDB Atlas + Vercel + Backend Hosting)

This guide outlines how to deploy the **Apacciflix Meet** platform. 

Since the project consists of a **Next.js Frontend** and a separate **Express Backend** (with stateful logic like battles/private shows), the deployment is split into three parts:

1.  **Database**: MongoDB Atlas (NoSQL)
2.  **Backend**: Render, Railway, or Heroku (Must be a persistent server, NOT serverless)
3.  **Frontend**: Vercel

---

## 1. Database Setup (MongoDB Atlas)

The project has been migrated to use MongoDB with Mongoose.

1.  **Create a MongoDB Atlas Cluster**:
    *   Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free cluster.
    *   Create a database user (username/password).
    *   Whitelist `0.0.0.0/0` (allow all IPs) or your backend host IP in "Network Access".
    *   Get your connection string: `mongodb+srv://<username>:<password>@cluster.mongodb.net/?retryWrites=true&w=majority`

2.  **Configuration**:
    *   The backend expects a `MONGODB_URI` environment variable.

---

## 2. Backend Deployment (Render/Railway)

The backend (`/backend`) cannot be deployed to Vercel easily because it uses:
*   **In-memory state** for Battles and Private Shows (`battles.ts`, `private-shows.ts`).
*   **Background intervals** (Monitors).
Vercel Serverless functions freeze/kill these processes.

**Recommended Host**: [Render.com](https://render.com) or [Railway.app](https://railway.app).

### Steps for Render:
1.  Push your code to GitHub.
2.  Create a **New Web Service** on Render.
3.  Connect your repository.
4.  **Root Directory**: `backend`
5.  **Build Command**: `npm install && npm run build`
6.  **Start Command**: `npm start`
7.  **Environment Variables**:
    *   `PORT`: `3001` (or let Render assign one)
    *   `LIVEKIT_API_KEY`: (From LiveKit Cloud)
    *   `LIVEKIT_API_SECRET`: (From LiveKit Cloud)
    *   `LIVEKIT_URL`: (Your LiveKit WebSocket URL)
    *   `JWT_SECRET`: (Generate a secure random string)
    *   `MONGODB_URI`: (Your MongoDB Atlas Connection String)

8.  Deploy. You will get a URL like `https://my-backend.onrender.com`.

---

## 3. Frontend Deployment (Vercel)

1.  **Push to GitHub**: Ensure your project is in a GitHub repository.
2.  **Import to Vercel**:
    *   Go to [vercel.com](https://vercel.com) -> Add New -> Project.
    *   Import your repository.
3.  **Configuration**:
    *   **Framework Preset**: Next.js (Automatic)
    *   **Root Directory**: `./` (Default)
4.  **Environment Variables**:
    *   `NEXT_PUBLIC_API_URL`: **Set this to your Deployed Backend URL** (e.g., `https://my-backend.onrender.com`).
    *   `NEXT_PUBLIC_CONN_DETAILS_ENDPOINT`: `/api/connection-details` (Default)
    *   `NEXT_PUBLIC_SHOW_SETTINGS_MENU`: `true` or `false`
    *   `LIVEKIT_API_KEY`: (Same as backend)
    *   `LIVEKIT_API_SECRET`: (Same as backend)
    *   `LIVEKIT_URL`: (Same as backend)
    
    *Note: The frontend needs LiveKit keys because some API routes (like `/api/connection-details`) might still reside in Next.js `app/api` folder. Check `app/api/connection-details/route.ts` - if it's used, Vercel needs these keys too.*

5.  **Deploy**: Click "Deploy".

---

## Post-Deployment Checks

1.  **CORS**: Ensure your Backend (Render) allows requests from your Frontend (Vercel domain).
    *   Update `backend/src/index.ts`: `app.use(cors({ origin: 'https://your-vercel-app.vercel.app' }));`
2.  **LiveKit**: Ensure your LiveKit cloud project is active.
3.  **Database**: Ensure the backend can connect to MongoDB.

## Future Improvements (Serverless Migration)

To deploy *everything* on Vercel (including backend), you would need to:
1.  Move all Express routes (`backend/src/index.ts`) to Next.js API Routes (`app/api/`).
2.  Replace in-memory state (`battles`, `privateShows`) with **Redis** (e.g., Upstash).
3.  Replace `setInterval` monitors with **Cron Jobs** (Vercel Cron).
