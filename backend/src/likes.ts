import { User } from './models/User.js';

export const sendLike = async (req: any, res: any) => {
  const { recipientUsername } = req.body;

  if (!recipientUsername) {
    return res.status(400).json({ message: 'Recipient username is required' });
  }

  try {
    const recipient = await User.findOne({ username: recipientUsername });

    if (!recipient) {
      return res.status(404).json({ message: 'Recipient not found' });
    }

    recipient.likes = (recipient.likes || 0) + 1;
    await recipient.save();

    res.json({ success: true, likes: recipient.likes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send like' });
  }
};
