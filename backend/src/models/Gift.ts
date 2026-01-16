import mongoose, { Document, Model } from 'mongoose';

export interface IGift extends Document {
  name: string;
  price: number;
  icon: string;
  type: 'standard' | 'premium' | 'luxury';
}

interface IGiftModel extends Model<IGift> {
  findAll(): Promise<IGift[]>;
  update(id: string, updates: any): Promise<IGift | null>;
  delete(id: string): Promise<boolean>;
}

const giftSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  icon: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['standard', 'premium', 'luxury'], 
    default: 'standard' 
  }
});

// Add static methods for compatibility
giftSchema.statics.findAll = function() {
  return this.find({});
};

giftSchema.statics.update = function(id: string, updates: any) {
  return this.findByIdAndUpdate(id, updates, { new: true });
};

giftSchema.statics.delete = async function(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return false;
  const result = await this.findByIdAndDelete(id);
  return !!result;
};

export const Gift = mongoose.model<IGift, IGiftModel>('Gift', giftSchema);
