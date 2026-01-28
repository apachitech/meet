import { User } from './models/User.js';

export const getModels = async (req: any, res: any) => {
    try {
        const models = await User.find({ role: 'model' }, 'username _id avatar previewUrl');
        const formattedModels = models.map((u: any) => ({ 
            id: u._id, 
            username: u.username,
            avatar: u.avatar,
            previewUrl: u.previewUrl
        }));
        res.json(formattedModels);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching models' });
    }
};
