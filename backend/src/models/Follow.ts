import mongoose, { Document, Model } from 'mongoose';

export interface IFollow extends Document {
  target: mongoose.Types.ObjectId;
  follower: mongoose.Types.ObjectId;
  createdAt: Date;
}

interface IFollowModel extends Model<IFollow> {}

const followSchema = new mongoose.Schema(
  {
    target: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    follower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

followSchema.index({ target: 1, follower: 1 }, { unique: true });

export const Follow = mongoose.model<IFollow, IFollowModel>('Follow', followSchema);

