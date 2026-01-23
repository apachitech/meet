# LemonSqueezy Integration Guide

This guide explains how to get the necessary credentials to connect LemonSqueezy to your application.

## 1. Create a LemonSqueezy Account
If you haven't already, sign up at [lemonsqueezy.com](https://www.lemonsqueezy.com/).
You will need to activate "Test Mode" or fully activate your store to generate live keys.

## 2. Get Your Credentials

### A. API Key (`LEMONSQUEEZY_API_KEY`)
1. Go to **Settings** > **API**.
2. Click **Generate New Key**.
3. Name it (e.g., "Meet App").
4. Copy the key immediately (it won't be shown again).

### B. Store ID (`LEMONSQUEEZY_STORE_ID`)
1. Go to **Settings** > **General**.
2. Look for **Store ID** (usually a 5-6 digit number next to your store name).
3. Alternatively, when you are in the dashboard, the Store ID is often visible in the URL or under the store name dropdown.

### C. Webhook Secret (`LEMONSQUEEZY_WEBHOOK_SECRET`)
1. Go to **Settings** > **Webhooks**.
2. Click **Create Webhook**.
3. **Callback URL**: Enter your backend URL + `/api/payment/lemon/webhook`.
   - *Local Development*: Use a tool like `ngrok` to get a public URL (e.g., `https://your-ngrok-id.ngrok-free.app/api/payment/lemon/webhook`).
   - *Production*: `https://your-domain.com/api/payment/lemon/webhook`
4. **Signing Secret**: Create a random string (e.g., `my_secret_123`) or click "Generate".
5. **Events**: Check `order_created`.
6. Save the webhook and copy the **Signing Secret**.

### D. Variant ID (`LEMONSQUEEZY_VARIANT_ID`)
You need a "Product Variant ID" for the token packages you sell.

1. Go to **Products** in your dashboard.
2. Create a new product (e.g., "100 Tokens").
   - Set the price (e.g., $9.99).
   - Save the product.
3. Once saved, go to the **Products** list.
4. Click the "Share" button or "Checkout Link" for that product.
5. The URL will look like: `https://store.lemonsqueezy.com/checkout/buy/12345`.
6. The number at the end (`12345`) is your **Variant ID**.
   - *Note*: If you have multiple variants (e.g., Basic, Pro), each has a unique ID. You can find them by editing the product and looking at the "Variants" section.

---

## 3. Configure Your Application

Open your `backend/.env` file and paste the values:

```env
LEMONSQUEEZY_API_KEY=your_api_key_here
LEMONSQUEEZY_STORE_ID=your_store_id_here
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret_here
LEMONSQUEEZY_VARIANT_ID=your_default_variant_id_here
```

## 4. Testing
1. Ensure your backend is running.
2. Make sure your Webhook URL is publicly accessible (use ngrok for localhost).
3. In LemonSqueezy, you can use "Test Mode" to simulate payments without real money.
