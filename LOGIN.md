# Login & Admin Access Guide

This document explains how to log in to the Apacciflix Meet platform and how to access administrative features.

## 1. Standard Login (User/Model)

### How to Login
1.  Navigate to the Login Page:
    *   Click **"Login"** in the top navigation bar.
    *   Or go directly to `/login`.
2.  Enter your **Username** and **Password**.
3.  Click **"Login"**.

### How to Register
1.  Navigate to the Login Page.
2.  Click **"Need an account? Register"** at the bottom.
3.  Fill in:
    *   **Username**
    *   **Email**
    *   **Password**
4.  Select your Role:
    *   **Viewer**: Can watch streams, buy tokens, send gifts.
    *   **Model**: Can broadcast live streams.
5.  Click **"Create Account"**.

---

## 2. Admin Login

The **Admin Dashboard** is located at `/admin`. It allows you to manage settings, users, gifts, and the token economy.

### How to Create an Admin Account
By default, the registration form only allows creating "Viewer" or "Model" accounts. To create an Admin account, you have two options:

#### Option A: Update via Database (Recommended for Production)
1.  Register a new account normally (e.g., username: `admin_user`) as a **Viewer**.
2.  Log in to your **MongoDB Atlas** dashboard.
3.  Browse the `users` collection.
4.  Find your user document.
5.  Edit the `role` field from `"user"` to `"admin"`.
6.  Click **Update**.

#### Option B: Register via API (Dev/Setup Only)
You can manually send a registration request with the admin role using a tool like **cURL** or **Postman**.

**Example cURL command:**
```bash
curl -X POST https://meet-yikm.onrender.com/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "my_admin",
    "password": "secure_password",
    "email": "admin@example.com",
    "role": "admin"
  }'
```

### How to Access Admin Dashboard
1.  Log in with your Admin account via the standard login page (`/login`).
2.  Once logged in, navigate manually to `/admin`.
    *   *Note: Standard users who try to access `/admin` will be redirected to the home page.*

### Admin Features
*   **Settings**: Change site name, colors, and background.
*   **Users**: View all users, check balances, and **promote/demote roles** (e.g., promote a user to Model).
*   **Gifts**: Add new gifts, change prices, or remove items.
*   **Economy**: Configure token packages and payment methods.
