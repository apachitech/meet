import mongoose, { Document, Model } from 'mongoose';

export interface IAdvertisement extends Document {
  title: string;
  imageUrl: string;
  targetUrl: string;
  location: 'home-top' | 'video-overlay' | 'sidebar' | 'footer';
  active: boolean;
}

const advertisementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageUrl: { type: String, required: true },
  targetUrl: { type: String, required: true },
  location: { 
    type: String, 
    enum: ['home-top', 'video-overlay', 'sidebar', 'footer'], 
    required: true 
  },
  active: { type: Boolean, default: true }
});

export const Advertisement = mongoose.model<IAdvertisement>('Advertisement', advertisementSchema);
