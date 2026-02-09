# Google Pay Integration Guide

This guide explains how to obtain the necessary credentials (Merchant ID) to enable Google Pay on your platform.

## Prerequisites

- A Google Account
- A Business/Merchant website (your deployed site)

## Step 1: Google Pay Business Console

1. Go to the [Google Pay & Wallet Console](https://pay.google.com/business/console/).
2. Sign in with your Google Account.
3. Create a **New Business Profile** if you haven't already.
   - Enter your business name, country, and other details.
   - Verify your business identity.

## Step 2: Create an Integration

1. Once your profile is set up, go to the **Google Pay API** tab in the left sidebar.
2. Click **Add your website** (or "Integrate with your website").
3. You will be asked to provide:
   - **Website URL**: The URL where your token store is hosted (e.g., `https://your-site.com`).
   - **Integration type**: Choose **Gateway** (since you are using a payment processor) or **Direct** (if you are PCI DSS compliant, but Gateway is recommended for most).

## Step 3: Get Your Merchant ID

1. After setting up your business profile, your **Merchant ID** will be visible in the top right corner of the Google Pay Business Console (it usually starts with `BCR...` or is a long numeric string).
2. Copy this ID.

## Step 4: Configure Your Payment Gateway

To process real money, you need a payment processor (Gateway) that supports Google Pay. Common supported gateways include:
- **Stripe**
- **Braintree**
- **Adyen**
- **Checkout.com**

### Example: Using Stripe
If you use Stripe as your gateway:
1. Log in to your Stripe Dashboard.
2. Enable "Google Pay" in your Payment Methods settings.
3. Get your **Stripe Publishable Key** (this usually acts as the `gatewayMerchantId` for the frontend configuration).

## Step 5: Configure Apacciflix Admin Panel

1. Log in to your Apacciflix Admin Dashboard.
2. Navigate to **Settings** -> **Payment Methods** -> **Google Pay**.
3. Fill in the fields:
   - **Merchant ID**: The ID you got from Step 3.
   - **Merchant Name**: Your business name (e.g., "Apacciflix").
   - **Gateway**: The name of your processor (e.g., `stripe`, `braintree`, or `example` for testing).
   - **Gateway Merchant ID**: Your identifier with that gateway (e.g., your Stripe Publishable Key).

## Testing

- By default, the integration is set to `TEST` environment.
- You can test using the [Google Pay Test Card Suite](https://developers.google.com/pay/api/web/guides/resources/test-card-suite).
- To go live, you must submit your integration for approval in the Google Pay Business Console.
