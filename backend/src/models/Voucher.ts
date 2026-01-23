import mongoose from 'mongoose';

const voucherSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  tokens: { type: Number, required: true },
  isUsed: { type: Boolean, default: false },
  usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  usedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date }
});

export const Voucher = mongoose.model('Voucher', voucherSchema);
