import { User } from './models/User.js';

// In a real app, integrate with PayPal SDK
// For this demo, we mock the payment flow but update real DB
export const createOrder = async (req: any, res: any) => {
  const { packageId, amount } = req.body;
  // Mock order ID
  const orderId = `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  res.json({ id: orderId, status: 'CREATED' });
};

export const captureOrder = async (req: any, res: any) => {
  const { orderId, packageId } = req.body;
  const userId = req.user.id;

  try {
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Payment failed' });
  }
};
