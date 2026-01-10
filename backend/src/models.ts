import { User } from './models/User.js';

export const getModels = async (req: any, res: any) => {
    try {
        const models = await User.find({ role: 'model' }, 'username _id');
        const formattedModels = models.map((u: any) => ({ id: u._id, username: u.username }));
        res.json(formattedModels);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching models' });
    }
};
