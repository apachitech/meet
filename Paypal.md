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

## Step 2: Configure the Project (Local Development)

You need to add these credentials to two environment files in your project.

### 1. Backend Configuration (`backend/.env`)

Open the file `backend/.env` and find the PayPal section. Paste your credentials there:

```env
# PayPal Configuration
# Use Sandbox credentials for testing, Live for real money
PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_CLIENT_SECRET=your_secret_here
PAYPAL_MODE=sandbox
```
*(Change `PAYPAL_MODE` to `live` when using real money)*

### 2. Frontend Configuration (`.env.local`)

Open the file `.env.local` in the root directory. You only need the **Client ID** here.

```env
# PayPal Configuration (Must match the Client ID in backend)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_client_id_here
```

---

## Step 3: Update Credentials in Production (Render & Vercel)

When deploying your app or switching to "Live" mode, you must update the Environment Variables on your hosting platforms.

### 1. Update Frontend (Vercel)
The Frontend needs the **Client ID** to show the buttons.

1.  Go to your **Vercel Dashboard**.
2.  Select your project (`livekit-meet`).
3.  Click on **Settings** (top menu) -> **Environment Variables** (left menu).
4.  Find `NEXT_PUBLIC_PAYPAL_CLIENT_ID`.
    *   Click the **Edit** icon (pencil).
    *   Paste your **Live Client ID**.
    *   Click **Save**.
5.  **Important**: You must **Redeploy** for changes to take effect.
    *   Go to **Deployments**.
    *   Click the three dots `...` next to the latest deployment -> **Redeploy**.

### 2. Update Backend (Render)
The Backend needs the **Client ID** and **Secret** to process payments.

1.  Go to your **Render Dashboard**.
2.  Select your backend service (e.g., `meet-backend`).
3.  Click on **Environment** (left menu).
4.  Update the following variables:
    *   `PAYPAL_CLIENT_ID`: Paste your **Live Client ID**.
    *   `PAYPAL_CLIENT_SECRET`: Paste your **Live Secret**.
    *   `PAYPAL_MODE`: Set to `live`.
5.  Click **Save Changes**.
6.  Render will automatically restart your server with the new credentials.

---

## Step 4: Switch to Production (Live) Checklist

When you are ready to accept real money:

1.  [ ] **PayPal Dashboard**: Switch toggle to **Live**. Create a Live App.
2.  [ ] **Vercel**: Update `NEXT_PUBLIC_PAYPAL_CLIENT_ID` with Live ID. **Redeploy**.
3.  [ ] **Render**: Update `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` with Live credentials. Set `PAYPAL_MODE` to `live`. **Save**.
4.  [ ] **Test**: Try to buy tokens. The PayPal popup should now ask for a real credit card/account, not a sandbox test account.

---

## Step 5: Google Pay Support

The application is configured to support Google Pay automatically alongside PayPal and Credit Cards.

1.  **Enable in Dashboard**: Ensure Google Pay is enabled in your PayPal Developer Dashboard for your App (if applicable).
2.  **Browser Support**: The "Google Pay" button will automatically appear in the payment popup or list **if**:
    *   The user is on a supported device/browser (Chrome, Android).
    *   The user has a Google Pay wallet configured.
3.  **Troubleshooting**: If the button doesn't appear, check if you are logged into a Google account with payment methods attached in Chrome.

## Troubleshooting

*   **Payment Failed?** Check the Render logs. If you see "Authentication failed", double-check that you copied the Secret correctly and that it matches the Client ID (Sandbox ID with Sandbox Secret).
*   **Buttons not showing?** Ensure `NEXT_PUBLIC_PAYPAL_CLIENT_ID` is set correctly in Vercel and that you have **Redeployed**.
