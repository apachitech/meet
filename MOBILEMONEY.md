# Mobile Money Payment Guide

This document explains how the Mobile Money payment system works in the application, including the user flow, admin configuration, and transaction processing.

## Overview

The Mobile Money system allows users to purchase tokens by manually sending money to a specified phone number (e.g., M-Pesa, MTN Mobile Money). Users submit their transaction details (Phone Number and Reference ID), which are then verified and processed by an Administrator.

---

## 1. Admin Configuration

Before users can use Mobile Money, an Admin must enable it and provide payment instructions.

1.  **Log in** as an Administrator.
2.  Navigate to the **Admin Console** (`/admin`).
3.  Click on the **Mobile Money** tab in the sidebar.
4.  **Configuration Section**:
    *   **Enable Mobile Money**: Check the box to turn the feature on.
    *   **Payment Instructions**: Enter the details users need to send money.
        *   *Example*: "Send money to 0712-345-678 (Name: John Doe). Enter the transaction code below."
5.  Click **Save Configuration**.

---

## 2. User Purchase Flow

Once enabled, users will see "Pay with Mobile Money" in the Token Store.

1.  User opens the **Token Store**.
2.  User selects a **Token Package**.
3.  User clicks **"📱 Pay with Mobile Money"**.
4.  The instructions set by the Admin are displayed.
5.  User performs the transfer on their phone.
6.  User enters:
    *   **Your Phone Number**: The number they sent money from.
    *   **Transaction Reference ID**: The unique code from the SMS receipt (e.g., `QHS123456`).
7.  User clicks **Confirm Payment**.
8.  The system records the transaction as `Pending` and notifies the user to wait for approval.

---

## 3. Processing Transactions (Admin)

Admins must manually verify payments before tokens are credited.

1.  Log in to the **Admin Console**.
2.  Go to the **Mobile Money** tab.
3.  Scroll to **Pending Transactions**.
4.  You will see a table with:
    *   **User**: Who requested the tokens.
    *   **Phone**: The number they claimed to send from.
    *   **Ref ID**: The transaction code they entered.
    *   **Amount**: The expected amount (based on the package price).
5.  **Verification**: Check your Mobile Money phone/account to confirm you received the specific amount with that Reference ID.
6.  **Action**:
    *   **Approve**: If the money was received. The user is **immediately credited** the tokens, and the status changes to `Approved`.
    *   **Reject**: If the money was not received or the details are invalid. The status changes to `Rejected`.

    ----------------------------------------------------------------------------------------------------------------

## 4. How to Register for Mobile Money

If you (as the Admin) need to set up a Mobile Money account to receive payments, follow these general steps. The process depends on your country and mobile network operator.

### Step 1: Choose a Provider
Common Mobile Money providers include:
-   **M-Pesa** (Safaricom/Vodacom) - Popular in East Africa.
-   **MTN Mobile Money (MoMo)** - Popular in West & South Africa.
-   **Airtel Money** - Popular in Africa & India.
-   **Orange Money** - Popular in West Africa.
-   **Wave** - Popular in Senegal & Ivory Coast.

### Step 2: Registration
1.  **Visit an Agent**: Go to a registered agent or customer care center for your chosen network.
2.  **Bring ID**: You will need a valid National ID or Passport.
3.  **Sim Card**: Ensure you have a registered SIM card for that network.
4.  **Activation**: The agent will register you, and you will receive an SMS to activate your PIN.

### Step 3: Recommended Apps
Once registered, download the official app to manage transactions easily:
-   **M-Pesa**: Download the *M-PESA App* or *MySafaricom*.
-   **MTN MoMo**: Download the *MTN MoMo* app.
-   **Airtel Money**: Download the *Airtel App* or *My Airtel*.
-   **Wave**: Download the *Wave* app.

*Tip: For high-volume business transactions, consider applying for a **Merchant Account** (Till Number or Paybill) which often provides better tracking and reporting than a personal line.*

## Database Models

-   **MobileMoneyTransaction**: Stores the transaction logs.
-   **Settings**: Stores the global `mobileMoney` configuration (enabled status, instructions).
