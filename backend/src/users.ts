import { User } from './models/User.js';

export const getUserByUsername = async (req: any, res: any) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      username: user.username,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      totalTips: user.totalTips || 0,
      totalLikes: user.totalLikes || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
