import mongoose from 'mongoose';

const mobileMoneyTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  packageId: { type: String, required: true },
  tokens: { type: Number, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  phoneNumber: { type: String, required: true },
  transactionReference: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export const MobileMoneyTransaction = mongoose.model('MobileMoneyTransaction', mobileMoneyTransactionSchema);
