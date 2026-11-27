import { randomInt } from 'crypto';

const SALT_ROUNDS = 12;

/**
 * Words for passphrases: short, easy to spell, and easy to read aloud.
 */
const WORDS = [
  'Apple', 'Anchor', 'Bear', 'Bird', 'Bridge', 'Cactus', 'Castle', 'Cloud', 'Comet', 'Cost',
  'Craving', 'Crown', 'Dolphin', 'Eagle', 'Echo', 'Falcon', 'Feast', 'Fire', 'Flower', 'Forest',
  'Fox', 'Garden', 'Ghost', 'Giant', 'Globe', 'Goat', 'Grape', 'Hawk', 'Hill', 'Honey',
  'Horse', 'House', 'Island', 'Jelly', 'Joy', 'King', 'Kite', 'Koala', 'Lake', 'Leaf',
  'Lemon', 'Lettuce', 'Light', 'Lime', 'Lion', 'Llama', 'Luck', 'Luna', 'Mango', 'Maple',
  'Melon', 'Mint', 'Moon', 'Moose', 'Moss', 'Mountain', 'Mouse', 'Night', 'Nova', 'Ocean',
  'Oink', 'Olive', 'Onion', 'Otter', 'Owl', 'Panda', 'Paralyses', 'Peach', 'Pearl', 'Penguin',
  'Pine', 'Pizza', 'Planet', 'Plum', 'Polar', 'Pond', 'Pool', 'Prize', 'Pug', 'Quest',
  'Rain', 'Raven', 'Reef', 'River', 'Robot', 'Rocket', 'Rose', 'Ruby', 'Sage', 'Sand',
  'Sea', 'Seal', 'Shark', 'Sheep', 'Shell', 'Ship', 'Sky', 'Snow', 'Solar', 'Spark',
  'Star', 'Stone', 'Storm', 'Sun', 'Swan', 'Swift', 'Taco', 'Tiger', 'Toast', 'Tower',
  'Tree', 'Tulip', 'Turtle', 'Valley', 'View', 'Vine', 'Wave', 'Whale', 'Wind', 'Wish',
  'Wolf', 'Wood', 'Wool', 'World', 'Worm', 'Wren', 'Yard', 'Zebra', 'Zen'
];

/**
 * Hash that is verified when an email address is unknown. It keeps the response
 * time of a failed sign-in equal for known and unknown addresses.
 */
export const UNKNOWN_USER_HASH =
  '$2b$12$2qjS/CknzYsNE.hNkMbfcuJgawKs2gERse1U/4/tRJNREr0lr2Gei';

/**
 * Pick one word with the cryptographically secure generator of the runtime.
 * Math.random is predictable and must not choose a password.
 */
function pickWord(): string {
  return WORDS[randomInt(WORDS.length)];
}

/**
 * Generate a memorable passphrase
 * Format: Word + Digit + # + Word + # + Word
 * Example: Planet1#Falcon#Pond
 */
export function generatePassword(): string {
  return `${pickWord()}${randomInt(1, 10)}#${pickWord()}#${pickWord()}`;
}

/**
 * Hash a password using Bun.password (native bcrypt) and return the result directly.
 * Use this form in a script: a process that reads its input from a pipe can end
 * before an asynchronous hash completes.
 * @param password - Plain text password
 * @returns Hashed password
 */
export function hashPasswordSync(password: string): string {
  return Bun.password.hashSync(password, {
    algorithm: 'bcrypt',
    cost: SALT_ROUNDS,
  });
}

/**
 * Hash a password using Bun.password (native bcrypt)
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return hashPasswordSync(password);
}

/**
 * Verify a password against a hash using Bun.password
 * @param password - Plain text password
 * @param hash - Hashed password to compare against
 * @returns True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return Bun.password.verify(password, hash);
}
