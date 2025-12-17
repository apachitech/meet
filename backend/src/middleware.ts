import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '509ce6f70283b645c681d68f17425278d0cc8143818f80347cbf3ccbca4acd96';

export const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};
