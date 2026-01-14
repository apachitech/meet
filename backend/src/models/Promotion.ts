import mongoose, { Document, Model } from 'mongoose';

export interface IPromotion extends Document {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  bannerUrl?: string;
  active: boolean;
}

const promotionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  bannerUrl: { type: String },
  active: { type: Boolean, default: true }
});

export const Promotion = mongoose.model<IPromotion>('Promotion', promotionSchema);
