import mongoose, { Document, Model } from 'mongoose';

export interface IMessage extends Document {
  roomName: string;
  sender: string;
  content: string;
  type: string; // 'chat', 'gift', 'like'
  timestamp: number;
}

interface IMessageModel extends Model<IMessage> {}

const messageSchema = new mongoose.Schema({
  roomName: { type: String, required: true, index: true },
  sender: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, default: 'chat' },
  timestamp: { type: Number, default: Date.now }
});

export const Message = mongoose.model<IMessage, IMessageModel>('Message', messageSchema);
