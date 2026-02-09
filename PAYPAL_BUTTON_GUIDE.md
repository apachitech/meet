# Using a Simple PayPal Button (No Complex API)

**Yes, you can simply place a PayPal button.** You do not need to build a massive, complex payment infrastructure if you use PayPal's client-side tools.

## Option 1: The "Link" Method (Manual Verification)
This is the absolute simplest way. It works exactly like the Bank Transfer method.

*   **How it works**: You place a simple link or button that opens `paypal.me/yourname` or a specific "Pay Now" link generated in your PayPal Dashboard.
*   **The Flow**:
    1.  User clicks button -> Redirects to PayPal.
    2.  User pays $20.
    3.  User returns to your site.
*   **The Catch**: Your website **does not know** the payment happened.
*   **Fulfillment**: You must check your PayPal email notifications, see who paid, and manually add tokens to their account in your Admin Panel.
*   **Verdict**: Good for starting out, but high friction for users (they have to wait for you).

## Option 2: PayPal "Smart Buttons" (Semi-Automatic)
This is likely what you are looking for. It involves copy-pasting a small JavaScript snippet into your frontend. It handles the popup, login, and payment UI automatically.

### How to Implement
1.  **Get Client ID**: Go to developer.paypal.com and get a "Client ID".
2.  **Add the Script**: Add the PayPal SDK script to your page.
3.  **Render the Button**:

```html
<!-- 1. Import PayPal SDK -->
<script src="https://www.paypal.com/sdk/js?client-id=YOUR_CLIENT_ID&currency=USD"></script>

<!-- 2. The Button Container -->
<div id="paypal-button-container"></div>

<!-- 3. The Logic -->
<script>
  paypal.Buttons({
    // Sets up the transaction when a payment button is clicked
    createOrder: (data, actions) => {
      return actions.order.create({
        purchase_units: [{
          amount: { 
            value: '10.00' // The price of the token package
          }
        }]
      });
    },
    // Finalize the transaction after payer approval
    onApprove: (data, actions) => {
      return actions.order.capture().then(function(orderData) {
        // Successful capture! 
        console.log('Capture result', orderData, JSON.stringify(orderData, null, 2));
        
        // CRITICAL STEP:
        // You must now call your own backend to give the user tokens.
        // If you do this only in the browser, hackers can fake it.
        fetch('/api/add-tokens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                orderId: orderData.id,
                userId: 'CURRENT_USER_ID' 
            })
        }).then(response => {
            if (response.ok) {
                alert('Tokens added! Thank you.');
            }
        });
      });
    }
  }).render('#paypal-button-container');
</script>
```

### Is this an "API Integration"?
Technically, yes, but it is **90% Frontend**.
*   **PayPal handles**: Credit card inputs, security, user login, success/failure UI.
*   **You handle**: Just one small endpoint (`/api/add-tokens`) to receive the "Success" message and update the database.

### Security Warning
**Do not** update the user's token balance directly inside the `onApprove` JavaScript function (e.g., `user.tokens += 100`).
*   **Why?**: Any user can open the browser console and run that code without paying.
*   **Fix**: Always send the PayPal `orderId` to your backend, check with PayPal if it's real (using a backend library), and *then* add tokens.

## Summary
*   **Can I just place a button?** Yes.
*   **If you use a "Link"**: You must manually give tokens (Manual).
*   **If you use "Smart Buttons"**: You copy-paste the UI code, but you still need a tiny bit of backend code to securely add the tokens (Automatic).
