import { MobileMoneyTransaction } from './models/MobileMoneyTransaction.js';
import { User } from './models/User.js';
import { Settings } from './models/Settings.js';

// User: Initiate Transaction
export const initiateMobileMoneyTransaction = async (req: any, res: any) => {
  try {
    const { packageId, phoneNumber, transactionReference } = req.body;
    const userId = req.user.userId;

    if (!packageId || !phoneNumber || !transactionReference) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const settings = await Settings.get();
    const pkg = settings.tokenPackages.find(p => p.id === packageId);
    
    if (!pkg) {
      return res.status(400).json({ message: 'Invalid package' });
    }

    const transaction = new MobileMoneyTransaction({
      userId,
      username: user.username,
      packageId,
      tokens: pkg.tokens,
      amount: pkg.price,
      phoneNumber,
      transactionReference,
      status: 'pending'
    });

    await transaction.save();

    res.json({ success: true, message: 'Transaction submitted for approval' });
  } catch (error: any) {
    console.error('Mobile Money Init Error:', error);
    res.status(500).json({ message: 'Failed to initiate transaction' });
  }
};

// Admin: Get Pending Transactions
export const getPendingMobileMoneyTransactions = async (req: any, res: any) => {
  try {
    const transactions = await MobileMoneyTransaction.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json({ transactions });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
};

// Admin: Approve/Reject Transaction
export const processMobileMoneyTransaction = async (req: any, res: any) => {
  try {
    const { transactionId, action } = req.body; // action: 'approve' | 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const transaction = await MobileMoneyTransaction.findById(transactionId);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    if (transaction.status !== 'pending') {
      return res.status(400).json({ message: 'Transaction is not pending' });
    }

    if (action === 'approve') {
      const user = await User.findById(transaction.userId);
      if (user) {
        user.tokenBalance += transaction.tokens;
        await user.save();
        transaction.status = 'approved';
        transaction.updatedAt = new Date();
        await transaction.save();
        return res.json({ success: true, message: 'Transaction approved and tokens credited' });
      } else {
        return res.status(404).json({ message: 'User associated with transaction not found' });
      }
    } else {
      transaction.status = 'rejected';
      transaction.updatedAt = new Date();
      await transaction.save();
      return res.json({ success: true, message: 'Transaction rejected' });
    }

  } catch (error: any) {
    console.error('Process Transaction Error:', error);
    res.status(500).json({ message: 'Failed to process transaction' });
  }
};
