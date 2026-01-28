# PayPal Payment Integration - Debugging Guide

## Issue: PayPal Button Spinning (No Payment Modal)

### Root Cause
The `/api/payment/create-order` endpoint is returning a 403 error because **the JWT token in localStorage is invalid**.

## Solution: Clear Token and Re-Login

### Step 1: Clear localStorage
1. Open your browser's Developer Tools (F12)
2. Go to **Console** tab
3. Paste and run this command:
```javascript
localStorage.clear()
console.log('Storage cleared:', localStorage)
```

### Step 2: Refresh Page
- Press **Ctrl+R** (or Cmd+R on Mac)

### Step 3: Log In Again
- Log in with your credentials again
- This will generate a **new, valid JWT token** 

### Step 4: Test Payment
1. Click the token/gift button to open TokenStore modal
2. Select a token package (e.g., "Starter - 100 tokens")
3. Click "PayPal" button
4. The payment modal should now appear instead of spinning

---

## Technical Details

### What's Happening Behind the Scenes

**When PayPal button is clicked:**
1. `createOrder()` function sends POST to `/api/payment/create-order`
2. Backend middleware checks JWT token signature
3. If token is invalid → returns 403 error
4. PayPal button doesn't get order ID → keeps spinning forever

**Why token is invalid:**
- Token may be from an old session
- JWT secret changed
- Browser cache issue
- Token expired

### Backend Flow (After Login Fixed)
```
User clicks PayPal Button
    ↓
createOrder() sends token + package info to backend
    ↓
Backend verifies JWT token ✓
    ↓
Backend fetches Settings from MongoDB
    ↓
Backend creates PayPal order via PayPal API
    ↓
Backend returns Order ID
    ↓
PayPal popup displays ✓
```

---

## Testing Checklist

After clearing localStorage and logging in again, test these:

- [ ] Login works
- [ ] Token appears in localStorage (check DevTools > Application > Local Storage)
- [ ] Click "Buy Tokens" button
- [ ] Select a package
- [ ] PayPal modal appears (instead of spinning)
- [ ] Complete a sandbox payment
- [ ] Tokens are added to account

---

## Sandbox Test Credentials

**PayPal Sandbox:**
- Client ID: `AT-rgGKNn15QMVebXUCrgk4Mvng6gD8-_DA-uQwxpjkUq8-ZbYIwVOD81KHcic4HoJRSFnjVpeYwP2cr`
- Mode: SANDBOX
- Buyer Email: `sb-mkxwj32657436@personal.example.com` (or create your own in PayPal dashboard)

---

## Debugging Browser Console

After steps 1-3 above, when clicking PayPal button, check browser console for messages:

**Good logs should show:**
```
[TokenStore] Starting Payment Flow
[TokenStore] API URL: http://localhost:3001
[TokenStore] Package: pkg_100 ($9.99)
[TokenStore] Sending request to http://localhost:3001/api/payment/create-order
[TokenStore] Response received: 200
[TokenStore] Order ID received: 7R...
```

**Bad logs (token issue) would show:**
```
[TokenStore] Response received: 403
[TokenStore] Error Body: {"message":"Token verification failed"}
```

---

## If Issue Persists

1. **Check backend is running:**
   - Open terminal in `backend` folder
   - Run `pnpm dev`
   - Should see: `Backend server listening at http://localhost:3001`

2. **Check environment variables:**
   - Verify `backend/.env` has `PAYPAL_MODE=sandbox`
   - Verify `app/.env.local` has `NEXT_PUBLIC_PAYPAL_CLIENT_ID`

3. **Check browser DevTools Network tab:**
   - Click PayPal button
   - Look for POST to `http://localhost:3001/api/payment/create-order`
   - Check Response tab to see what error is returned

---

## Contact Support

If PayPal still doesn't work after trying these steps:
1. Share the Network tab response from step 3 above
2. Share the browser console logs
3. Confirm backend is running and showing no errors
