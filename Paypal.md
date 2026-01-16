# PayPal Integration Guide

This guide explains how to obtain your PayPal API credentials and configure them in your application to start accepting payments.

## Step 1: Get PayPal Credentials

1.  **Log in to the PayPal Developer Dashboard**
    *   Go to [https://developer.paypal.com/dashboard/](https://developer.paypal.com/dashboard/).
    *   Log in with your PayPal business account.

2.  **Create an App**
    *   Navigate to the **Apps & Credentials** page.
    *   Toggle between **Sandbox** (for testing) and **Live** (for real payments). **Start with Sandbox**.
    *   Click **Create App**.
    *   Enter an **App Name** (e.g., "Apacciflix Meet").
    *   Select **Merchant** as the App Type.
    *   Click **Create App**.

3.  **Copy Credentials**
    *   Once the app is created, you will see your API credentials.
    *   Copy the **Client ID**.
    *   Click "Show" to reveal and copy the **Secret**.

---

## Step 2: Configure the Project

You need to add these credentials to two environment files in your project.

### 1. Backend Configuration (`backend/.env`)

Open the file `backend/.env` and find the PayPal section. Paste your credentials there:

```env
# PayPal Configuration
# Use Sandbox credentials for testing, Live for real money
PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_CLIENT_SECRET=your_secret_here
```

### 2. Frontend Configuration (`.env.local`)

Open the file `.env.local` in the root directory. You only need the **Client ID** here.

```env
# PayPal Configuration (Must match the Client ID in backend)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_client_id_here
```

---

## Step 3: Switch to Production (Live)

When you are ready to accept real money:

1.  Go back to the PayPal Developer Dashboard.
2.  Switch the toggle at the top from **Sandbox** to **Live**.
3.  Create a **Live App** (or use the default one).
4.  Copy the **Live Client ID** and **Live Secret**.
5.  Update both `backend/.env` and `.env.local` with these new "Live" credentials.
6.  **Important**: In `backend/.env`, ensure `NODE_ENV=production` is set (or simply ensure the server is running in production mode) so the backend uses the Live PayPal environment.

## Troubleshooting

*   **Payment Failed?** Check the backend console logs. If you see "Authentication failed", double-check that you copied the Secret correctly and that it matches the Client ID (Sandbox ID with Sandbox Secret).
*   **Buttons not showing?** Ensure `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is set correctly in `.env.local` and that you have restarted the frontend server after changing `.env.local`.
