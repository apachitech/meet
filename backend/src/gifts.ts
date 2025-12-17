import { User } from './models/User.js';

const gifts = [
  { id: '1', name: 'Rose', price: 1 },
  { id: '2', name: 'Diamond', price: 10 },
  { id: '3', name: 'Heart', price: 5 },
  { id: '4', name: 'Sports Car', price: 50 }, // Added just for fun/premium feel
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

  try {
    const sender = await User.findById(senderId);
    /* 
       Note: The recipientId comes from the LiveKit participant identity.
       In our previous implementation, we used user.id (UUID) as identity.
       Now we use Mongoose _id.
       So recipientId should be a valid Mongo ID.
    */
    const recipient = await User.findById(recipientId);

    if (!sender || !recipient) {
      return res.status(404).json({ message: 'Sender or recipient not found' });
    }

    if (sender.tokenBalance < gift.price) {
      return res.status(400).json({ message: 'Insufficient tokens' });
    }

    sender.tokenBalance -= gift.price;
    recipient.tokenBalance += gift.price;

    await sender.save();
    await recipient.save();

    res.json({ message: 'Gift sent successfully', senderBalance: sender.tokenBalance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Transaction failed' });
  }
};

export const getGifts = (req, res) => {
  res.json(gifts);
};
