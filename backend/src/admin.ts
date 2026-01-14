import { User } from './models/User.js';
import { Settings } from './models/Settings.js';
import { Gift } from './models/Gift.js';
import { Promotion } from './models/Promotion.js';
import { Advertisement } from './models/Advertisement.js';

export const getSettings = async (req: any, res: any) => {
    const settings = await Settings.get();
    res.json(settings);
};

export const updateSettings = async (req: any, res: any) => {
    const settings = await Settings.update(req.body);
    res.json(settings);
};

export const getUsers = async (req: any, res: any) => {
    // Return minimal info
    const users = await User.find({}, 'username _id role tokenBalance email');
    res.json(users);
};

export const updateUserRole = async (req: any, res: any) => {
    const { id } = req.params;
    const { role } = req.body;
    
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    user.role = role;
    await user.save();
    
    res.json({ message: 'Role updated', user });
};

export const adminCreditUser = async (req: any, res: any) => {
    const { id } = req.params;
    const { amount, reason } = req.body; // amount can be negative to deduct

    if (typeof amount !== 'number') return res.status(400).json({ message: 'Invalid amount' });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.tokenBalance = (user.tokenBalance || 0) + amount;
    // Ensure balance doesn't go below 0? Or allow overdraft? Let's allow negative for corrections, but generally 0 floor.
    if (user.tokenBalance < 0) user.tokenBalance = 0;

    await user.save();
    res.json({ message: 'Balance updated', newBalance: user.tokenBalance });
};

export const adminSendGift = async (req: any, res: any) => {
    const { id } = req.params;
    const { giftId } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const gift = await Gift.findById(giftId);
    if (!gift) return res.status(404).json({ message: 'Gift not found' });

    // Add gift value to user balance
    user.tokenBalance = (user.tokenBalance || 0) + gift.price;
    await user.save();

    // In a real app, we might create a Transaction record here

    res.json({ message: 'Gift sent', newBalance: user.tokenBalance, giftName: gift.name });
};

// Gift CRUD
export const adminGetGifts = async (req: any, res: any) => {
    const gifts = await Gift.findAll();
    res.json(gifts);
};

export const adminAddGift = async (req: any, res: any) => {
    const gift = await Gift.create(req.body);
    res.json(gift);
};

export const adminUpdateGift = async (req: any, res: any) => {
    const { id } = req.params;
    const gift = await Gift.update(id, req.body);
    if (!gift) return res.status(404).json({ message: 'Gift not found' });
    res.json(gift);
};

export const adminDeleteGift = async (req: any, res: any) => {
    const { id } = req.params;
    const success = await Gift.delete(id);
    if (!success) return res.status(404).json({ message: 'Gift not found' });
    res.json({ message: 'Gift deleted' });
};

// Promotion CRUD
export const adminGetPromotions = async (req: any, res: any) => {
    const promotions = await Promotion.find().sort({ startDate: -1 });
    res.json(promotions);
};

export const adminAddPromotion = async (req: any, res: any) => {
    try {
        const promotion = await Promotion.create(req.body);
        res.json(promotion);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const adminUpdatePromotion = async (req: any, res: any) => {
    const { id } = req.params;
    const promotion = await Promotion.findByIdAndUpdate(id, req.body, { new: true });
    if (!promotion) return res.status(404).json({ message: 'Promotion not found' });
    res.json(promotion);
};

export const adminDeletePromotion = async (req: any, res: any) => {
    const { id } = req.params;
    await Promotion.findByIdAndDelete(id);
    res.json({ message: 'Promotion deleted' });
};

// Advertisement CRUD
export const adminGetAds = async (req: any, res: any) => {
    const ads = await Advertisement.find();
    res.json(ads);
};

export const adminAddAd = async (req: any, res: any) => {
    try {
        const ad = await Advertisement.create(req.body);
        res.json(ad);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const adminUpdateAd = async (req: any, res: any) => {
    const { id } = req.params;
    const ad = await Advertisement.findByIdAndUpdate(id, req.body, { new: true });
    if (!ad) return res.status(404).json({ message: 'Ad not found' });
    res.json(ad);
};

export const adminDeleteAd = async (req: any, res: any) => {
    const { id } = req.params;
    await Advertisement.findByIdAndDelete(id);
    res.json({ message: 'Ad deleted' });
};

// Public Access for Ads (Active Only)
export const getActiveAds = async (req: any, res: any) => {
    const { location } = req.query;
    const query: any = { active: true };
    if (location) query.location = location;
    
    const ads = await Advertisement.find(query);
    res.json(ads);
};
