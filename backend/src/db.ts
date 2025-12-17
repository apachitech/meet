import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const file = join(__dirname, 'db.json');

class LowWithLodash<T> extends Low<T> {
  chain: any = {};
}

const adapter = new JSONFile<{ users: any[] }>(file);
const db = new LowWithLodash(adapter);

await db.read();

db.data ||= { users: [] };

await db.write();

export default db;
