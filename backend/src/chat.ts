import { Message } from './models/Message.js';

export const saveMessage = async (req: any, res: any) => {
  const { roomName, sender, content, type } = req.body;
  if (!roomName || !sender || !content) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const msg = await Message.create({
      roomName,
      sender,
      content,
      type: type || 'chat',
      timestamp: Date.now()
    });
    res.json({ success: true, message: msg });
  } catch (error) {
    console.error('Failed to save message', error);
    res.status(500).json({ message: 'Failed to save message' });
  }
};

export const getMessages = async (req: any, res: any) => {
  const { roomName } = req.params;
  try {
    const messages = await Message.find({ roomName }).sort({ timestamp: -1 }).limit(50);
    res.json(messages.reverse());
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};
