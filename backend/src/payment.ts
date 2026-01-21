import { User } from './models/User.js';
import dotenv from 'dotenv';
dotenv.config();

export const createOrder = async (req: any, res: any) => {
  const { packageId, amount } = req.body;

  // Always use Mock/Simulated Order
  console.log('Creating Simulated Card Order');
  const orderId = `SIM-ORDER-${Date.now()}`;
  return res.json({ id: orderId, status: 'CREATED' });
};

export const captureOrder = async (req: any, res: any) => {
  const { orderId, packageId } = req.body;
  const userId = req.user.userId;

  try {
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
        message: 'Payment successful (Simulated)', 
        newBalance: user.tokenBalance 
    });
  } catch (error: any) {
    console.error('Payment Capture Error:', error);
    res.status(500).json({ message: 'Payment failed', error: error.message });
  }
};
