import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, '../db.json');

// Initialize DB if not exists
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ users: [], gifts: [], settings: {} }, null, 2));
}

export const db = {
  read: () => {
    try {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      // Ensure structure
      if (!parsed.users) parsed.users = [];
      if (!parsed.gifts) parsed.gifts = [];
      if (!parsed.settings) parsed.settings = { siteName: 'Apacciflix', primaryColor: '#ef4444' };
      return parsed;
    } catch (err) {
      return { users: [], gifts: [], settings: { siteName: 'Apacciflix', primaryColor: '#ef4444' } };
    }
  },
  write: (data: any) => {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  }
};
