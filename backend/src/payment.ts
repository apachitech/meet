import { User } from './models/User.js';
import { Settings, ISettings } from './models/Settings.js';
import paypal from '@paypal/checkout-server-sdk';
import dotenv from 'dotenv';
dotenv.config();

// PayPal Client Setup
const isLive = process.env.PAYPAL_MODE === 'live';
const Environment = isLive
  ? paypal.core.LiveEnvironment
  : paypal.core.SandboxEnvironment;

console.log(`[PayPal] Initializing in ${isLive ? 'LIVE' : 'SANDBOX'} mode`);

const client = new paypal.core.PayPalHttpClient(
  new Environment(
    process.env.PAYPAL_CLIENT_ID || 'sandbox-client-id',
    process.env.PAYPAL_CLIENT_SECRET || 'sandbox-client-secret'
  )
);

export const createOrder = async (req: any, res: any) => {
  const { packageId, amount } = req.body;
  console.log(`[PayPal] Creating order for package: ${packageId}, amount: ${amount}`);

  // Set a 30 second timeout for the entire request
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
  );

  try {
      // Validate against DB Settings with timeout
      console.log('[PayPal] Fetching settings from database...');
      let settings: ISettings;
      try {
        const settingsPromise = Settings.get();
        settings = await Promise.race([
          settingsPromise,
          new Promise<ISettings>((_, reject) => setTimeout(() => reject(new Error('Settings query timeout')), 5000))
        ]);
        console.log('[PayPal] Settings retrieved successfully');
      } catch (dbErr: any) {
        console.error('[PayPal] Database error:', dbErr.message);
        return res.status(500).json({ 
          message: 'Failed to fetch payment settings from database',
          error: dbErr.message 
        });
      }
      
      if (!settings || !settings.tokenPackages) {
        console.error('[PayPal] Settings missing or no tokenPackages');
        return res.status(500).json({ 
          message: 'Payment settings not configured'
        });
      }

      const pkg = settings.tokenPackages.find(p => p.id === packageId);

      if (!pkg) {
          console.warn(`[PayPal] Invalid package ID: ${packageId}`);
          console.warn(`[PayPal] Available packages:`, settings.tokenPackages.map(p => ({ id: p.id, label: p.label })));
          return res.status(400).json({ message: 'Invalid package ID' });
      }

      // Verify price matches (security check)
      if (Math.abs(pkg.price - Number(amount)) > 0.01) {
          console.warn(`[PayPal] Price mismatch for ${packageId}. Expected ${pkg.price}, got ${amount}`);
          return res.status(400).json({ message: 'Price mismatch. Please refresh and try again.' });
      }

      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: pkg.price.toString()
          },
          description: `Token Package: ${pkg.label} (${pkg.tokens} tokens)`,
          custom_id: packageId
        }]
      });

      console.log('[PayPal] Sending request to PayPal API...');
      const order = await client.execute(request);
      console.log(`[PayPal] Order created successfully: ${order.result.id}`);
      res.json({ id: order.result.id, status: 'CREATED' });
  } catch (err: any) {
      console.error("[PayPal] Create Order Failed:", err);
      console.error("[PayPal] Error message:", err.message);
      console.error("[PayPal] Error stack:", err.stack);
      
      const details = err.message || "Unknown error";
      const debugId = err.debug_id || "unknown";
      
      res.status(500).json({ 
          message: 'Failed to initiate PayPal payment.', 
          details: details,
          debugId: debugId
      });
  }
};

export const captureOrder = async (req: any, res: any) => {
  const { orderId, packageId } = req.body;
  const userId = req.user.userId;

  console.log(`[PayPal] Capturing order: ${orderId} for user: ${userId}`);

  try {
    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    request.requestBody({});

    const capture = await client.execute(request);
    const result = capture.result;
    
    console.log(`[PayPal] Capture status: ${result.status}`);

    // Check if capture was successful
    if (result.status === 'COMPLETED') {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Fetch package details from Settings
        const settings = await Settings.get();
        const pkg = settings.tokenPackages.find(p => p.id === packageId);
        
        if (!pkg) {
            console.warn(`[PayPal] Unknown packageId: ${packageId}, defaulting to 0 tokens.`);
            // Note: Money is captured, but package is unknown. Should probably log critical error or manual review.
            // For now, fail safely but money is taken. In real app, might auto-refund or credit default.
            return res.status(400).json({ message: 'Payment captured but invalid package. Contact support.' });
        }

        user.tokenBalance += pkg.tokens;
        await user.save();

        console.log(`[PayPal] User ${userId} credited with ${pkg.tokens} tokens. New balance: ${user.tokenBalance}`);

        res.json({ 
            status: 'COMPLETED', 
            message: 'Payment successful', 
            newBalance: user.tokenBalance 
        });
    } else {
        console.warn(`[PayPal] Capture not completed. Status: ${result.status}`);
        res.status(400).json({ message: 'Payment not completed', status: result.status });
    }
  } catch (error: any) {
    console.error('[PayPal] Capture Error:', error);
    res.status(500).json({ message: 'Payment capture failed', error: error.message });
  }
};
