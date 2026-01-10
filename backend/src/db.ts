// import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async () => {
  console.log('Using simple JSON DB (No MongoDB required)');
  // No-op for now
};

export default connectDB;
