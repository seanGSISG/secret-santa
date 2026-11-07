import { Database } from 'bun:sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ensure data directory exists
const dataDir = join(__dirname, '../../data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const dbPath = join(dataDir, 'santa.db');
const db = new Database(dbPath);
export { db };

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Initialize schema
const schemaPath = join(__dirname, 'schema.sql');
const schema = readFileSync(schemaPath, 'utf-8');

// Execute schema (creates tables if they don't exist)
// bun:sqlite has .exec() for multiple statements? Or use .run()?
// Based on docs, db.exec() exists for scripts.
db.run(schema);

const userColumns = db.query('PRAGMA table_info(users)').all() as { name: string }[];
if (!userColumns.some((column) => column.name === 'language')) {
  db.run("ALTER TABLE users ADD COLUMN language TEXT NOT NULL DEFAULT 'fr'");
}
if (!userColumns.some((column) => column.name === 'secondhand_preference')) {
  db.run('ALTER TABLE users ADD COLUMN secondhand_preference INTEGER NOT NULL DEFAULT 1');
}
if (!userColumns.some((column) => column.name === 'participates_in_draw')) {
  db.run('ALTER TABLE users ADD COLUMN participates_in_draw INTEGER NOT NULL DEFAULT 1');
}

console.log('Database initialized at:', dbPath);

// Type definitions for database rows
export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  is_admin: number;
  has_seen_reveal: number;
  language: 'fr' | 'en';
  secondhand_preference: number;
  participates_in_draw: number;
  created_at: string;
}

export interface Match {
  id: number;
  giver_id: number;
  receiver_id: number;
  year: number;
}

export interface WishlistItem {
  id: number;
  user_id: number;
  amazon_url: string;
  title: string | null;
  image_url: string | null;
  price: string | null;
  added_at: string;
}

export interface Session {
  id: string;
  user_id: number;
  expires_at: string;
}
