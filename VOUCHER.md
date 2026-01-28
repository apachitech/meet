# Voucher System Documentation

This document explains how the redemption code (voucher) system works in the application.

## 1. Overview
The Voucher System allows administrators to generate unique alphanumeric codes that users can redeem for tokens. This is useful for:
- Promotions and giveaways.
- Manual sales (users pay via WhatsApp/Telegram, admin sends a code).
- Compensation or rewards.

## 2. Data Structure
The system uses a MongoDB model named `Voucher` with the following fields:

| Field | Type | Description |
|-------|------|-------------|
| `code` | String | The unique 12-character code (e.g., `ABCD-1234-EFGH`). |
| `tokens` | Number | The value of the voucher (e.g., 500 tokens). |
| `isUsed` | Boolean | Tracks if the code has been redeemed (`false` by default). |
| `usedBy` | ObjectId | Reference to the User who redeemed the code. |
| `usedAt` | Date | Timestamp of when the redemption occurred. |
| `createdAt` | Date | Timestamp of when the voucher was generated. |
| `expiresAt` | Date | (Optional) Expiration date for the voucher. |

**Source Code**: `backend/src/models/Voucher.ts`

## 3. How It Works

### A. Generating Vouchers (Admin)
1.  **Admin Action**: The admin navigates to the **Admin Dashboard -> Vouchers** tab.
2.  **Input**: The admin fills out a form specifying:
    - **Amount**: How many tokens each code is worth (e.g., 100).
    - **Count**: How many codes to generate (e.g., 50).
    - **Expiry**: (Optional) Number of days until the codes expire.
3.  **Process**:
    - The backend generates random alphanumeric strings formatted in groups of 4 (e.g., `X9Z2-P1M3-Q5R8`).
    - It ensures each code is unique in the database.
    - It bulk-inserts the new vouchers into the `vouchers` collection.
4.  **Result**: The codes are displayed in the Admin Dashboard list and can be copied/distributed.

**API Endpoint**: `POST /api/admin/vouchers`

### B. Redeeming Vouchers (User)
1.  **User Action**: The user opens the **"Get Tokens"** modal and enters a code in the redemption field.
2.  **Validation**:
    - The backend searches for the code (case-insensitive).
    - Checks if the code exists.
    - Checks if `isUsed` is `true` (rejects if already used).
    - Checks if `expiresAt` has passed (rejects if expired).
3.  **Execution**:
    - **User Update**: The system adds the voucher's `tokens` value to the user's `tokenBalance`.
    - **Voucher Update**: The voucher is marked as `isUsed: true`, and the user's ID and timestamp are recorded.
4.  **Result**: The user receives a success message, and their token balance is immediately updated.

**API Endpoint**: `POST /api/payment/redeem`

## 4. Security & Safety
- **Uniqueness**: Every code is guaranteed to be unique at the time of generation.
- **Concurrency**: Database operations are atomic to prevent double-spending (two users trying to claim the same code at the exact same millisecond).
- **Validation**: Strict checks prevent redeeming expired or non-existent codes.
- **Audit Trail**: The system records exactly *who* used a code and *when*, allowing admins to track usage.

## 5. Manual Payment Flow (Example)
1.  User contacts Admin via WhatsApp/Telegram (link in Token Store).
2.  User pays Admin manually (e.g., via Bank Transfer, Cash App).
3.  Admin goes to **Admin Dashboard -> Vouchers**.
4.  Admin generates a code worth the purchased amount (e.g., 1000 tokens).
5.  Admin copies the code and sends it to the User via chat.
6.  User enters the code in the app and instantly gets their tokens.
