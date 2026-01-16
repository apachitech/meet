import mongoose, { Document, Model } from 'mongoose';

export interface ISection extends Document {
  title: string;
  filterType: 'all' | 'recommended' | 'new' | 'tag' | 'random';
  filterValue?: string; // e.g. "South African" if filterType is 'tag'
  order: number;
  active: boolean;
}

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  filterType: { 
    type: String, 
    enum: ['all', 'recommended', 'new', 'tag', 'random'], 
    default: 'all' 
  },
  filterValue: { type: String },
  order: { type: Number, default: 0 },
  active: { type: Boolean, default: true }
});

export const Section = mongoose.model<ISection>('Section', sectionSchema);
