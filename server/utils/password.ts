import { randomInt } from 'node:crypto';

const SALT_ROUNDS = 12;

/**
 * Generate a memorable passphrase
 * Format: Word + Digit + five # separated words
 * Example: Oink9#Craving#Cost#Anchor#Lemon#Panda
 */
export function generatePassword(): string {
  const words = [
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

  const getWord = () => words[randomInt(words.length)];
  const part1 = getWord();
  const digit = randomInt(1, 10);
  const remainingParts = Array.from({ length: 5 }, getWord);

  return `${part1}${digit}#${remainingParts.join('#')}`;
}

/**
 * Hash a password using Bun.password (native bcrypt)
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: SALT_ROUNDS,
  });
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
