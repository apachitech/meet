import { User } from './models/User.js';
import paypal from '@paypal/checkout-server-sdk';
import dotenv from 'dotenv';
dotenv.config();

// PayPal Client Setup
const Environment = process.env.NODE_ENV === 'production'
  ? paypal.core.LiveEnvironment
  : paypal.core.SandboxEnvironment;

const client = new paypal.core.PayPalHttpClient(
  new Environment(
    process.env.PAYPAL_CLIENT_ID || 'sandbox-client-id',
    process.env.PAYPAL_CLIENT_SECRET || 'sandbox-client-secret'
  )
);

export const createOrder = async (req: any, res: any) => {
  const { packageId, amount } = req.body;

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      amount: {
        currency_code: 'USD',
        value: amount.toString()
      },
      description: `Token Package: ${packageId}`
    }]
  });

  try {
    const order = await client.execute(request);
    res.json({ id: order.result.id, status: 'CREATED' });
  } catch (err: any) {
    console.error('PayPal Create Order Error:', err);
    // Fallback for demo/dev if credentials are invalid
    if (process.env.NODE_ENV !== 'production' && (!process.env.PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID === 'sandbox-client-id')) {
        console.warn('Using Mock PayPal Order due to missing credentials');
        const orderId = `MOCK-ORDER-${Date.now()}`;
        return res.json({ id: orderId, status: 'CREATED' });
    }
    res.status(500).json({ message: 'Failed to create order', error: err.message });
  }
};

export const captureOrder = async (req: any, res: any) => {
  const { orderId, packageId } = req.body;
  const userId = req.user.userId;

  try {
    // If it's a mock order, skip PayPal capture
    if (orderId.startsWith('MOCK-ORDER-')) {
         const user = await User.findById(userId);
         if (!user) return res.status(404).json({ message: 'User not found' });
         
         const tokenPackages: Record<string, number> = {
            'pkg_100': 100,
            'pkg_500': 500,
            'pkg_1000': 1000,
            'pkg_5000': 5000
        };

        const tokensToAdd = tokenPackages[packageId] || 0;
        if (tokensToAdd > 0) {
            user.tokenBalance += tokensToAdd;
            await user.save();
        }
        
        return res.json({ 
            status: 'COMPLETED', 
            message: 'Payment successful (Mock)', 
            newBalance: user.tokenBalance 
        });
    }

    const request = new paypal.orders.OrdersCaptureRequest(orderId);
    // request.requestBody({});

    const capture = await client.execute(request);
    
    // Check if capture was successful
    if (capture.result.status === 'COMPLETED') {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Define packages map (should match frontend)
        const tokenPackages: Record<string, number> = {
            'pkg_100': 100,
            'pkg_500': 500,
            'pkg_1000': 1000,
            'pkg_5000': 5000
        };

        const tokensToAdd = tokenPackages[packageId];
        if (!tokensToAdd) return res.status(400).json({ message: 'Invalid package' });

        user.tokenBalance += tokensToAdd;
        await user.save();

        res.json({ 
            status: 'COMPLETED', 
            message: 'Payment successful', 
            newBalance: user.tokenBalance 
        });
    } else {
        res.status(400).json({ message: 'Payment not completed', status: capture.result.status });
    }
  } catch (error: any) {
    console.error('PayPal Capture Error:', error);
    res.status(500).json({ message: 'Payment failed', error: error.message });
  }
};
