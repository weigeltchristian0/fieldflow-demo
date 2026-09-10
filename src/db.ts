import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(here, '..', 'warehouse', 'demo.db');

const db = new DatabaseSync(DB_PATH, { readOnly: true });

export function query<T>(sql: string, params: (string | number)[] = []): T[] {
  return db.prepare(sql).all(...params) as T[];
}
