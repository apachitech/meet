import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { register, login } from './auth.js';
import { authenticateToken } from './middleware.js';
import connectDB from './db.js';
import { sendGift, getGifts } from './gifts.js';
import { getModels } from './models.js';
import { User } from './models/User.js';

const app = express();
const port = 3001;

// Connect to Database
connectDB();

app.use(cors());
app.use(bodyParser.json());

app.post('/api/register', register);
app.post('/api/login', login);

app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user?.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ username: user.username, tokenBalance: user.tokenBalance, role: user.role, email: user.email });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/gift', authenticateToken, sendGift);
app.get('/api/gifts', getGifts);
app.get('/api/models', getModels);

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
