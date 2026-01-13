import { User, IUser } from './models/User.js';
import { Follow } from './models/Follow.js';

export const getUserByUsername = async (req: any, res: any) => {
  const { username } = req.params;

  try {
    const user: IUser | null = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      username: user.username,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      totalTips: user.totalTips || 0,
      totalLikes: user.totalLikes || 0,
      followersCount: user.followersCount || 0,
      viewsCount: user.viewsCount || 0,
      tokenBalance: user.tokenBalance || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const incrementViewCount = async (req: any, res: any) => {
  const { username } = req.params;
  try {
    const user: IUser | null = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.viewsCount = (user.viewsCount || 0) + 1;
    await user.save();
    res.json({ viewsCount: user.viewsCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const followUser = async (req: any, res: any) => {
  const { username } = req.params;
  try {
    const target: IUser | null = await User.findOne({ username });
    if (!target) return res.status(404).json({ message: 'User not found' });
    const followerId = req.user.userId;
    const exists = await Follow.findOne({ target: target._id, follower: followerId });
    if (exists) return res.json({ message: 'Already following', followersCount: target.followersCount });
    await Follow.create({ target: target._id, follower: followerId });
    target.followersCount = (target.followersCount || 0) + 1;
    await target.save();
    res.json({ message: 'Followed', followersCount: target.followersCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const unfollowUser = async (req: any, res: any) => {
  const { username } = req.params;
  try {
    const target: IUser | null = await User.findOne({ username });
    if (!target) return res.status(404).json({ message: 'User not found' });
    const followerId = req.user.userId;
    const doc = await Follow.findOne({ target: target._id, follower: followerId });
    if (!doc) return res.json({ message: 'Not following', followersCount: target.followersCount });
    await Follow.deleteOne({ _id: doc._id });
    target.followersCount = Math.max(0, (target.followersCount || 0) - 1);
    await target.save();
    res.json({ message: 'Unfollowed', followersCount: target.followersCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const isFollowing = async (req: any, res: any) => {
  const { username } = req.params;
  try {
    const target: IUser | null = await User.findOne({ username });
    if (!target) return res.status(404).json({ message: 'User not found' });
    const followerId = req.user?.userId;
    if (!followerId) return res.json({ isFollowing: false });
    const exists = await Follow.findOne({ target: target._id, follower: followerId });
    res.json({ isFollowing: !!exists });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
