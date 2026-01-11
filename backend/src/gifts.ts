import { User } from './models/User.js';
import { updateBattleScoreByUsername } from './battles.js';
import { Gift } from './models/Gift.js';

export const sendGift = async (req: any, res: any) => {
  const { recipientId, giftId } = req.body;
  const senderId = req.user.userId;

  if (!recipientId || !giftId) {
    return res.status(400).json({ message: 'Recipient and gift are required' });
  }

  const gifts = await Gift.findAll();
  const gift = gifts.find((g: any) => g.id === giftId);
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
    recipient.totalTips = (recipient.totalTips || 0) + gift.price;

    await sender.save();
    await recipient.save();

    // Check for active battle in the sender's current room context
    if (req.body.roomName) {
        // Ensure that we are updating the battle score for the correct user
        // We use the recipient's username because the battle system tracks usernames
        if (recipient.username) {
            updateBattleScoreByUsername(req.body.roomName, recipient.username, gift.price);
        }
    }

    res.json({ message: 'Gift sent successfully', senderBalance: sender.tokenBalance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Transaction failed' });
  }
};

export const getGifts = async (req: any, res: any) => {
  const gifts = await Gift.findAll();
  res.json(gifts);
};
