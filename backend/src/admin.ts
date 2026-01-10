import { User } from './models/User.js';
import { Settings } from './models/Settings.js';
import { Gift } from './models/Gift.js';

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
