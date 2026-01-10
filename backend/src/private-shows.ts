import { Request, Response } from 'express';
import { User } from './models/User.js';

interface PrivateSession {
    modelUsername: string;
    payerUsername: string;
    startTime: number;
    lastDeductionTime: number;
    pricePerMinute: number;
}

const activeSessions: Map<string, PrivateSession> = new Map(); // Key: modelUsername

export const startPrivateShow = async (req: Request, res: Response) => {
    const { modelUsername } = req.body;
    const payer = (req as any).user;
    const pricePerMinute = 50;

    if (!modelUsername) return res.status(400).json({ message: 'Model username required' });

    if (activeSessions.has(modelUsername)) {
        return res.status(409).json({ message: 'Model is already in a private show' });
    }

    // Check if model exists (optional but good)
    const modelUser = await User.findOne({ username: modelUsername, role: 'model' });
    if (!modelUser) return res.status(404).json({ message: 'Model not found' });

    const payerUser = await User.findById(payer.id);
    if (!payerUser || payerUser.tokenBalance < pricePerMinute) {
        return res.status(402).json({ message: 'Insufficient tokens. Need 50 tokens to start.' });
    }

    // Deduct first minute immediately
    payerUser.tokenBalance -= pricePerMinute;
    await payerUser.save();
    
    // Credit the model (e.g. 80% share)
    modelUser.tokenBalance += pricePerMinute * 0.8;
    await modelUser.save();

    const session: PrivateSession = {
        modelUsername,
        payerUsername: payerUser.username,
        startTime: Date.now(),
        lastDeductionTime: Date.now(),
        pricePerMinute
    };

    activeSessions.set(modelUsername, session);
    
    res.json({ success: true, message: 'Private show started', balance: payerUser.tokenBalance });
};

export const stopPrivateShow = async (req: Request, res: Response) => {
    const { modelUsername } = req.body;
    const user = (req as any).user;
    
    const session = activeSessions.get(modelUsername);
    if (!session) return res.status(404).json({ message: 'No active private show' });

    // Only payer or model can stop
    if (user.username !== session.payerUsername && user.username !== session.modelUsername) {
         return res.status(403).json({ message: 'Unauthorized' });
    }

    activeSessions.delete(modelUsername);
    res.json({ success: true, message: 'Private show ended' });
};

export const getPrivateStatus = (req: Request, res: Response) => {
    const { modelUsername } = req.query;
    if (typeof modelUsername !== 'string') return res.status(400).json({ message: 'Invalid model username' });
    
    const session = activeSessions.get(modelUsername);
    if (session) {
        res.json({ isPrivate: true, payer: session.payerUsername, startTime: session.startTime });
    } else {
        res.json({ isPrivate: false });
    }
};

// Background task to monitor and bill sessions
export const initPrivateShowMonitor = () => {
    setInterval(async () => {
        const now = Date.now();
        for (const [modelUsername, session] of activeSessions.entries()) {
            if (now - session.lastDeductionTime >= 60000) {
                // Time to deduct (every 60 seconds)
                const payerUser = await User.findOne({ username: session.payerUsername });
                const modelUser = await User.findOne({ username: modelUsername });
                
                if (payerUser && payerUser.tokenBalance >= session.pricePerMinute) {
                    payerUser.tokenBalance -= session.pricePerMinute;
                    await payerUser.save();
                    
                    if (modelUser) {
                        modelUser.tokenBalance += session.pricePerMinute * 0.8;
                        await modelUser.save();
                    }
                    
                    session.lastDeductionTime = now;
                    console.log(`Deducted ${session.pricePerMinute} from ${payerUser.username} for private show with ${modelUsername}`);
                } else {
                    // Out of funds
                    console.log(`Ending private show for ${modelUsername} - Insufficient funds`);
                    activeSessions.delete(modelUsername);
                }
            }
        }
    }, 5000); // Check every 5s
};
