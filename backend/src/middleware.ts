import jwt from 'jsonwebtoken';
import { User } from './models/User.js';

export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('[Auth] No token provided');
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET || '509ce6f70283b645c681d68f17425278d0cc8143818f80347cbf3ccbca4acd96', (err: any, user: any) => {
    if (err) {
      console.log('[Auth] Token verification failed:', err.message);
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

export const authenticateAdmin = (req: any, res: any, next: any) => {
    authenticateToken(req, res, async () => {
        try {
            // Double check user role from DB
            const user = await User.findById(req.user.userId);
            if (!user) {
                console.log(`[Admin Auth] User ${req.user.userId} not found in DB`);
                return res.status(403).json({ message: 'User not found' });
            }
            
            if (user.role !== 'admin') {
                console.log(`[Admin Auth] Access denied. User ${user.username} has role: ${user.role}`);
                return res.status(403).json({ message: 'Access Denied: Admin role required' });
            }
            
            next();
        } catch (error) {
            console.error('[Admin Auth] Error verifying admin status:', error);
            return res.status(500).json({ message: 'Internal Server Error during auth' });
        }
    });
};
