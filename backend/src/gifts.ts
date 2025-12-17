import db from './db.js';

const gifts = [
  { id: '1', name: 'Rose', price: 1 },
  { id: '2', name: 'Diamond', price: 10 },
  { id: '3', name: 'Heart', price: 5 },
];

export const sendGift = async (req, res) => {
  const { recipientId, giftId } = req.body;
  const senderId = req.user.id;

  if (!recipientId || !giftId) {
    return res.status(400).json({ message: 'Recipient and gift are required' });
  }

  const gift = gifts.find((g) => g.id === giftId);
  if (!gift) {
    return res.status(404).json({ message: 'Gift not found' });
  }

  await db.read();

  const sender = db.data.users.find((u) => u.id === senderId);
  const recipient = db.data.users.find((u) => u.id === recipientId);

  if (!sender || !recipient) {
    return res.status(404).json({ message: 'Sender or recipient not found' });
  }

  if (sender.tokenBalance < gift.price) {
    return res.status(400).json({ message: 'Insufficient tokens' });
  }

  sender.tokenBalance -= gift.price;
  recipient.tokenBalance += gift.price;

  await db.write();

  res.json({ message: 'Gift sent successfully', senderBalance: sender.tokenBalance });
};

export const getGifts = (req, res) => {
  res.json(gifts);
};
