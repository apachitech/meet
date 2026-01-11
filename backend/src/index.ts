import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import bodyParser from 'body-parser';
import cors from 'cors';
import { register, login } from './auth.js';
import { authenticateToken } from './middleware.js';
import connectDB from './db.js';
import { sendGift, getGifts } from './gifts.js';
import { sendLike } from './likes.js';
import { getModels } from './models.js';
import { getUserByUsername } from './users.js';
import { User } from './models/User.js';
import { startPrivateShow, stopPrivateShow, getPrivateStatus, initPrivateShowMonitor } from './private-shows.js';
import { getBattleStatus, startBattle, stopBattle } from './battles.js';
import { createOrder, captureOrder } from './payment.js';
import { 
    getSettings, updateSettings, getUsers, updateUserRole, 
    adminAddGift, adminUpdateGift, adminDeleteGift, adminGetGifts 
} from './admin.js';
import { authenticateAdmin } from './middleware.js';

const app = express();
const port = 3001;

// Connect to Database
connectDB();
initPrivateShowMonitor();

app.use(cors());
app.use(bodyParser.json());

// Public Profile Route
app.get('/api/public/profile/:username', async (req: any, res: any) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({
            username: user.username,
            likes: user.likes,
            avatar: user.avatar,
            bio: user.bio,
            role: user.role
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/register', register);
app.post('/api/login', login);

app.get('/api/profile', authenticateToken, async (req: any, res: any) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ 
        username: user.username, 
        tokenBalance: user.tokenBalance, 
        totalTips: user.totalTips,
        totalLikes: user.totalLikes,
        role: user.role, 
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        settings: user.settings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/profile', authenticateToken, async (req: any, res: any) => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const { email, bio, settings, avatar } = req.body;
    if (email) user.email = email;
    if (avatar !== undefined) user.avatar = avatar;
    if (bio !== undefined) user.bio = bio;
    if (settings) {
        user.settings = { ...user.settings, ...settings };
    }
    
    await user.save();
    res.json({ message: 'Profile updated', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/gift', authenticateToken, sendGift);
app.post('/api/like', sendLike);
app.get('/api/gifts', getGifts);
app.get('/api/models', getModels);
app.get('/api/users/:username', getUserByUsername);

// Private Show Routes
app.post('/api/private/start', authenticateToken, startPrivateShow);
app.post('/api/private/stop', authenticateToken, stopPrivateShow);
app.get('/api/private/status', getPrivateStatus);

// Battle Routes
app.post('/api/battle/start', authenticateToken, startBattle);
app.post('/api/battle/stop', authenticateToken, stopBattle);
app.get('/api/battle/status', getBattleStatus);

// Payment Routes
app.post('/api/payment/create-order', authenticateToken, createOrder);
app.post('/api/payment/capture-order', authenticateToken, captureOrder);

// Admin Routes
app.get('/api/admin/settings', getSettings); // Public read for now? Or auth? Ideally public read for theme, auth write.
app.put('/api/admin/settings', authenticateAdmin, updateSettings);
app.get('/api/admin/users', authenticateAdmin, getUsers);
app.put('/api/admin/users/:id/role', authenticateAdmin, updateUserRole);

// Admin Gift Management
app.get('/api/admin/gifts', adminGetGifts); // Public/Admin
app.post('/api/admin/gifts', authenticateAdmin, adminAddGift);
app.put('/api/admin/gifts/:id', authenticateAdmin, adminUpdateGift);
app.delete('/api/admin/gifts/:id', authenticateAdmin, adminDeleteGift);

app.get('/', (req: any, res: any) => {
  res.send('Backend server is running!');
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
