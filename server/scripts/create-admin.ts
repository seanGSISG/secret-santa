#!/usr/bin/env bun

/**
 * Script to create an admin user. Run it from the server folder: bun scripts/create-admin.ts
 * The answers come from the keyboard, or from a pipe with one answer on each line.
 */

import * as readline from 'readline';
import { db } from '../db/database.js';
import { hashPasswordSync } from '../utils/password.js';

const MIN_PASSWORD_LENGTH = 8;

interface Answers {
  ask: (prompt: string) => Promise<string>;
  close: () => void;
}

/** Ask on the keyboard, one answer at a time. */
function askOnKeyboard(): Answers {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return {
    ask: (prompt) =>
      new Promise((resolve) => {
        rl.question(prompt, (answer) => {
          resolve(answer.trim());
        });
      }),
    close: () => {
      rl.close();
    },
  };
}

/** Read a pipe to the end first. A pipe delivers all its lines before the later questions are asked. */
async function askFromPipe(): Promise<Answers> {
  const lines = (await Bun.stdin.text()).split('\n');
  return {
    ask: async (prompt) => {
      process.stdout.write(`${prompt}\n`);
      return (lines.shift() ?? '').trim();
    },
    close: () => {},
  };
}

async function main() {
  console.log('=== Create Admin User ===\n');

  const answers = process.stdin.isTTY ? askOnKeyboard() : await askFromPipe();

  const email = (await answers.ask('Email: ')).toLowerCase();
  const name = await answers.ask('Name: ');
  const password = await answers.ask(`Password (at least ${MIN_PASSWORD_LENGTH} characters): `);
  answers.close();

  if (!email || !name) {
    console.error('\nError: All fields are required');
    process.exit(1);
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`\nError: The password must have at least ${MIN_PASSWORD_LENGTH} characters`);
    process.exit(1);
  }

  // Check if email already exists
  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  if (existing) {
    console.error(`\nError: User with email "${email}" already exists`);
    process.exit(1);
  }

  const passwordHash = hashPasswordSync(password);

  const result = db
    .prepare('INSERT INTO users (email, password_hash, name, is_admin) VALUES (?, ?, ?, 1)')
    .run(email, passwordHash, name);

  console.log('\n✓ Admin user created successfully!');
  console.log(`  ID: ${result.lastInsertRowid}`);
  console.log(`  Email: ${email}`);
  console.log(`  Name: ${name}`);
  console.log('\nYou can now log in with this account.\n');
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
