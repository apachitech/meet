import { Request, Response } from 'express';
import { Voucher } from './models/Voucher.js';
import { User } from './models/User.js';

// Helper to generate random code
const generateCodeString = (length: number = 12) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        if (i > 0 && i % 4 === 0) result += '-';
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export const redeemCode = async (req: any, res: any) => {
    const { code } = req.body;
    const userId = req.user.userId;

    if (!code) {
        return res.status(400).json({ message: 'Code is required' });
    }

    try {
        // Find voucher (case insensitive)
        const voucher = await Voucher.findOne({ 
            code: { $regex: new RegExp(`^${code}$`, 'i') } 
        });

        if (!voucher) {
            return res.status(404).json({ message: 'Invalid code' });
        }

        if (voucher.isUsed) {
            return res.status(400).json({ message: 'This code has already been used' });
        }

        if (voucher.expiresAt && new Date() > voucher.expiresAt) {
            return res.status(400).json({ message: 'This code has expired' });
        }

        // Update User
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.tokenBalance += voucher.tokens;
        await user.save();

        // Update Voucher
        voucher.isUsed = true;
        voucher.usedBy = userId;
        voucher.usedAt = new Date();
        await voucher.save();

        console.log(`[Redemption] User ${user.username} redeemed code ${voucher.code} for ${voucher.tokens} tokens`);

        res.json({ 
            success: true, 
            message: `Successfully redeemed ${voucher.tokens} tokens!`,
            newBalance: user.tokenBalance,
            tokensAdded: voucher.tokens
        });

    } catch (error: any) {
        console.error('[Redemption] Error:', error);
        res.status(500).json({ message: 'Failed to redeem code', error: error.message });
    }
};

// Admin: Generate Vouchers
export const generateVouchers = async (req: any, res: any) => {
    const { amount, count = 1, expiryDays } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Valid token amount is required' });
    }

    try {
        const vouchers = [];
        const expiresAt = expiryDays ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000) : undefined;

        for (let i = 0; i < count; i++) {
            let code = generateCodeString();
            // Ensure uniqueness (simple retry)
            while (await Voucher.findOne({ code })) {
                code = generateCodeString();
            }

            vouchers.push({
                code,
                tokens: amount,
                expiresAt
            });
        }

        await Voucher.insertMany(vouchers);

        res.json({ 
            success: true, 
            message: `Generated ${count} vouchers for ${amount} tokens each`,
            vouchers 
        });

    } catch (error: any) {
        console.error('[Redemption] Generate Error:', error);
        res.status(500).json({ message: 'Failed to generate vouchers' });
    }
};

// Admin: List Vouchers
export const getVouchers = async (req: any, res: any) => {
    try {
        const vouchers = await Voucher.find().sort({ createdAt: -1 }).limit(100);
        res.json({ vouchers });
    } catch (error: any) {
        res.status(500).json({ message: 'Failed to fetch vouchers' });
    }
};
