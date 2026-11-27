import { Router } from 'express';
import { randomInt } from 'crypto';
import { db, User, Match } from '../db/database.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { generatePassword, hashPassword } from '../utils/password.js';
import { sendMatchEmail, sendWelcomeEmail } from '../services/email.js';

const router = Router();

/**
 * Email validation regex - RFC 5322 compliant basic pattern
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const MIN_PASSWORD_LENGTH = 8;

/**
 * Return a copy of a list in a random order. The order of a draw must not be predictable,
 * so the shuffle uses the cryptographically secure generator of the runtime.
 */
function shuffled<T>(items: readonly T[]): T[] {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

/**
 * Check a manual edit of the matches. In a valid exchange every giver gives one gift,
 * every person receives one gift, nobody gives to themselves, and every id is a user.
 * The list must contain every person, so a closed cycle of two people among six is not valid.
 * Return true, or the reason why the edit is not valid.
 */
function validateMatches(matches: Array<{ giver_id?: unknown; receiver_id?: unknown }>): true | string {
  const userIds = new Set(
    db.prepare<Pick<User, 'id'>, []>('SELECT id FROM users').all().map((user) => user.id)
  );
  const givers = new Set<number>();
  const receivers = new Set<number>();

  for (const match of matches) {
    const { giver_id, receiver_id } = match ?? {};

    if (typeof giver_id !== 'number' || typeof receiver_id !== 'number') {
      return 'Invalid match structure';
    }
    if (!userIds.has(giver_id) || !userIds.has(receiver_id)) {
      return 'Every match must use two people from the list';
    }
    if (giver_id === receiver_id) {
      return 'A person cannot give a gift to themselves';
    }
    if (givers.has(giver_id)) {
      return 'A person cannot give more than one gift';
    }
    if (receivers.has(receiver_id)) {
      return 'A person cannot receive more than one gift';
    }

    givers.add(giver_id);
    receivers.add(receiver_id);
  }

  for (const receiver of receivers) {
    if (!givers.has(receiver)) {
      return 'Every person who receives a gift must also give one';
    }
  }

  if (givers.size !== userIds.size) {
    return 'Every person must give one gift and receive one gift';
  }

  return true;
}

// All admin routes require authentication and admin privileges
router.use(requireAuth);
router.use(requireAdmin);

/**
 * GET /api/admin/users
 * List all users
 */

router.get('/users', async (req, res) => {
  try {
    const users = db.prepare<User, []>('SELECT * FROM users ORDER BY name').all();

    res.json({
      users: users.map((user: User) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: !!user.is_admin,
        hasSeenReveal: !!user.has_seen_reveal,
        createdAt: user.created_at,
      })),
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/users
 * Create new user with generated password
 */
router.post('/users', async (req, res) => {
  try {
    const { email, name, isAdmin, password: manualPassword } = req.body ?? {};

    // Validate required fields
    if (typeof email !== 'string' || typeof name !== 'string' || !email || !name) {
      res.status(400).json({ error: 'Email and name required' });
      return;
    }

    // A password that the admin types must be long enough to resist guessing
    if (
      manualPassword !== undefined &&
      (typeof manualPassword !== 'string' || manualPassword.length < MIN_PASSWORD_LENGTH)
    ) {
      res.status(400).json({ error: `Password must have at least ${MIN_PASSWORD_LENGTH} characters` });
      return;
    }

    // Sanitize inputs
    const sanitizedEmail = email.trim().toLowerCase();
    const sanitizedName = name.trim();

    // Validate email format
    if (!EMAIL_REGEX.test(sanitizedEmail)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // Validate name is not empty after trimming
    if (!sanitizedName) {
      res.status(400).json({ error: 'Name cannot be empty' });
      return;
    }

    // Check if email already exists
    const existing = db
      .prepare<User, [string]>('SELECT * FROM users WHERE email = ?')
      .get(sanitizedEmail);

    if (existing) {
      res.status(409).json({ error: 'Email already exists' });
      return;
    }

    // Generate password if not provided
    const password = manualPassword || generatePassword();
    const passwordHash = await hashPassword(password);

    // Insert user
    const result = db
      .prepare(
        'INSERT INTO users (email, password_hash, name, is_admin) VALUES (?, ?, ?, ?)'
      )
      .run(sanitizedEmail, passwordHash, sanitizedName, isAdmin === true ? 1 : 0);

    // Get created user
    const user = db
      .prepare<User, [number]>('SELECT * FROM users WHERE id = ?')
      .get(result.lastInsertRowid as number);

    if (!user) {
      res.status(500).json({ error: 'Failed to retrieve user' });
      return;
    }

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: !!user.is_admin,
        hasSeenReveal: !!user.has_seen_reveal,
        createdAt: user.created_at,
      },
      password, // Return plaintext password only on creation
    });

    // Send welcome email asynchronously
    (async () => {
      try {
        console.log(`Sending welcome email to ${user.email}...`);
        await sendWelcomeEmail(user.email, user.name);
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
      }
    })();
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete user
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    // Prevent deleting self
    if (userId === req.user!.id) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }

    // Check if user exists
    const user = db.prepare<User, [number]>('SELECT * FROM users WHERE id = ?').get(userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Delete the user and keep the exchange complete. A match row that names the user
    // is deleted with the user, so the repair writes new rows after the delete.
    const deleteAndRepair = db.transaction((userId: number) => {
      const year = new Date().getFullYear();
      const incoming = db
        .prepare<Match, [number, number]>('SELECT * FROM matches WHERE receiver_id = ? AND year = ?')
        .get(userId, year);
      const outgoing = db
        .prepare<Match, [number, number]>('SELECT * FROM matches WHERE giver_id = ? AND year = ?')
        .get(userId, year);

      // A pair that only gave to each other leaves one person without a partner.
      const partner =
        incoming && outgoing && incoming.giver_id === outgoing.receiver_id ? incoming.giver_id : null;
      const host =
        partner === null
          ? undefined
          : db
              .prepare<Match, [number, number, number]>(
                'SELECT * FROM matches WHERE year = ? AND giver_id NOT IN (?, ?) LIMIT 1'
              )
              .get(year, partner, userId);

      db.prepare('DELETE FROM wishlist_items WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM matches WHERE giver_id = ? OR receiver_id = ?').run(userId, userId);
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);

      const insertMatch = db.prepare('INSERT INTO matches (giver_id, receiver_id, year) VALUES (?, ?, ?)');
      let changedGivers: number[] = [];

      if (incoming && outgoing && partner === null) {
        // A chain of three or more people: the person who gave to this user now gives to
        // the person this user gave to.
        insertMatch.run(incoming.giver_id, outgoing.receiver_id, year);
        changedGivers = [incoming.giver_id];
      } else if (partner !== null && host) {
        // The pair: move the other person into another chain.
        db.prepare('UPDATE matches SET receiver_id = ? WHERE id = ?').run(partner, host.id);
        insertMatch.run(partner, host.receiver_id, year);
        changedGivers = [partner, host.giver_id];
      } else if (incoming || outgoing) {
        // No safe repair exists (for example an exchange of two people). Clear the year.
        db.prepare('DELETE FROM matches WHERE year = ?').run(year);
        db.prepare('UPDATE users SET has_seen_reveal = 0').run();
        return { cleared: true, changedGivers: [] as number[] };
      }

      // The people who got a different recipient see the reveal again
      const resetReveal = db.prepare('UPDATE users SET has_seen_reveal = 0 WHERE id = ?');
      for (const giver of changedGivers) {
        resetReveal.run(giver);
      }
      return { cleared: false, changedGivers };
    });

    const result = deleteAndRepair(userId);
    const findName = db.prepare<Pick<User, 'name'>, [number]>('SELECT name FROM users WHERE id = ?');
    const changedGivers = result.changedGivers
      .map((id) => findName.get(id)?.name)
      .filter((name): name is string => name !== undefined);

    res.json({ success: true, cleared: result.cleared, changedGivers });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/admin/users/:id
 * Update user name and/or email
 * SECURITY FIX: Uses fixed SQL structure instead of dynamic construction
 */
router.put('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { name, email } = req.body ?? {};

    if ((name !== undefined && typeof name !== 'string') || (email !== undefined && typeof email !== 'string')) {
      res.status(400).json({ error: 'Name and email must be text' });
      return;
    }

    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    // Check if user exists
    const user = db.prepare<User, [number]>('SELECT * FROM users WHERE id = ?').get(userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Validate at least one field is provided
    if (!name && !email) {
      res.status(400).json({ error: 'At least one field (name or email) is required' });
      return;
    }

    // Sanitize inputs
    const sanitizedName = name ? name.trim() : null;
    const sanitizedEmail = email ? email.trim().toLowerCase() : null;

    // Validate name is not empty after trimming (if provided)
    if (sanitizedName !== null && !sanitizedName) {
      res.status(400).json({ error: 'Name cannot be empty' });
      return;
    }

    // Validate email format (if provided)
    if (sanitizedEmail !== null && !EMAIL_REGEX.test(sanitizedEmail)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // If email is being updated, check uniqueness
    if (sanitizedEmail && sanitizedEmail !== user.email.toLowerCase()) {
      const existing = db
        .prepare<User, [string, number]>(
          'SELECT * FROM users WHERE email = ? AND id != ?'
        )
        .get(sanitizedEmail, userId);

      if (existing) {
        res.status(409).json({ error: 'Email already exists' });
        return;
      }
    }

    // SECURITY FIX: Use fixed SQL structure instead of dynamic construction
    // This prevents SQL injection by avoiding string concatenation in SQL
    if (sanitizedName && sanitizedEmail) {
      db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(
        sanitizedName,
        sanitizedEmail,
        userId
      );
    } else if (sanitizedName) {
      db.prepare('UPDATE users SET name = ? WHERE id = ?').run(sanitizedName, userId);
    } else if (sanitizedEmail) {
      db.prepare('UPDATE users SET email = ? WHERE id = ?').run(sanitizedEmail, userId);
    }

    // Get updated user
    const updatedUser = db
      .prepare<User, [number]>('SELECT * FROM users WHERE id = ?')
      .get(userId);

    if (!updatedUser) {
      res.status(500).json({ error: 'Failed to retrieve updated user' });
      return;
    }

    res.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        isAdmin: !!updatedUser.is_admin,
        hasSeenReveal: !!updatedUser.has_seen_reveal,
        createdAt: updatedUser.created_at,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/admin/users/:id/reset-password
 * Reset user password
 */
router.put('/users/:id/reset-password', async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    // Check if user exists
    const user = db.prepare<User, [number]>('SELECT * FROM users WHERE id = ?').get(userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Generate new password
    const password = generatePassword();
    const passwordHash = await hashPassword(password);

    // Update password
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
      passwordHash,
      userId
    );

    // Delete all sessions for this user
    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);

    res.json({ password }); // Return plaintext password
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Match data interface for type safety
 */
interface MatchWithNames {
  id: number;
  giver_id: number;
  receiver_id: number;
  year: number;
  giver_name: string;
  giver_email: string;
  receiver_name: string;
  receiver_email: string;
}

/**
 * GET /api/admin/matches
 * Get all matches for current year
 */
router.get('/matches', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    // Get all matches with user names
    const matches = db
      .prepare<MatchWithNames, [number]>(
        `SELECT
          m.id,
          m.giver_id,
          m.receiver_id,
          m.year,
          g.name as giver_name,
          g.email as giver_email,
          r.name as receiver_name,
          r.email as receiver_email
        FROM matches m
        JOIN users g ON m.giver_id = g.id
        JOIN users r ON m.receiver_id = r.id
        WHERE m.year = ?
        ORDER BY g.name`
      )
      .all(currentYear);

    res.json({
      year: currentYear,
      matches: matches.map((m: MatchWithNames) => ({
        id: m.id,
        giver: {
          id: m.giver_id,
          name: m.giver_name,
          email: m.giver_email,
        },
        receiver: {
          id: m.receiver_id,
          name: m.receiver_name,
          email: m.receiver_email,
        },
      })),
    });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/admin/matches/generate
 * Generate new Secret Santa matches for current year
 * Uses circular assignment algorithm
 */
router.post('/matches/generate', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    // Get all users
    const users = shuffled(db.prepare<User, []>('SELECT * FROM users').all());

    if (users.length < 2) {
      res.status(400).json({ error: 'Need at least 2 users to generate matches' });
      return;
    }

    // Generate circular matches (each person gives to the next, last gives to first)
    const matches: Array<{ giver_id: number; receiver_id: number }> = [];

    for (let i = 0; i < users.length; i++) {
      const giver = users[i];
      const receiver = users[(i + 1) % users.length]; // Circular: last person gives to first

      matches.push({
        giver_id: giver.id,
        receiver_id: receiver.id,
      });
    }

    // Use transaction to ensure atomicity of match generation
    const generateMatches = db.transaction((year: number, matchList: Array<{ giver_id: number; receiver_id: number }>) => {
      // Delete existing matches for this year
      db.prepare('DELETE FROM matches WHERE year = ?').run(year);

      // Reset has_seen_reveal for all users
      db.prepare('UPDATE users SET has_seen_reveal = 0').run();

      // Insert matches
      const stmt = db.prepare(
        'INSERT INTO matches (giver_id, receiver_id, year) VALUES (?, ?, ?)'
      );

      for (const match of matchList) {
        stmt.run(match.giver_id, match.receiver_id, year);
      }
    });

    generateMatches(currentYear, matches);

    // Return created matches with names
    const createdMatches = db
      .prepare<MatchWithNames, [number]>(
        `SELECT
          m.id,
          m.giver_id,
          m.receiver_id,
          m.year,
          g.name as giver_name,
          g.email as giver_email,
          r.name as receiver_name,
          r.email as receiver_email
        FROM matches m
        JOIN users g ON m.giver_id = g.id
        JOIN users r ON m.receiver_id = r.id
        WHERE m.year = ?
        ORDER BY g.name`
      )
      .all(currentYear);

    res.json({
      year: currentYear,
      matches: createdMatches.map((m: MatchWithNames) => ({
        id: m.id,
        giver: {
          id: m.giver_id,
          name: m.giver_name,
          email: m.giver_email,
        },
        receiver: {
          id: m.receiver_id,
          name: m.receiver_name,
          email: m.receiver_email,
        },
      })),
    });

    // Send emails asynchronously
    (async () => {
      try {
        // The log must never contain a match: a log is not a secret place.
        console.log(`Sending ${createdMatches.length} match emails...`);
        for (const match of createdMatches) {
          if (match.giver_email) {
            await sendMatchEmail({ name: match.giver_name, email: match.giver_email });
          }
        }
        console.log('Finished sending match emails');
      } catch (error) {
        console.error('Error sending match emails:', error);
      }
    })();
  } catch (error) {
    console.error('Generate matches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/admin/matches
 * Update Secret Santa matches manually
 */
router.put('/matches', async (req, res) => {
  try {
    const { matches } = req.body ?? {}; // Array of { giver_id, receiver_id }
    const currentYear = new Date().getFullYear();

    if (!Array.isArray(matches) || matches.length === 0) {
      res.status(400).json({ error: 'Invalid matches data' });
      return;
    }

    const invalidReason = validateMatches(matches);
    if (invalidReason !== true) {
      res.status(400).json({ error: invalidReason });
      return;
    }

    // Perform update in transaction
    const updateMatches = db.transaction((year: number, matchList: Array<{ giver_id: number; receiver_id: number }>) => {
      const previous = new Map(
        db
          .prepare<Match, [number]>('SELECT * FROM matches WHERE year = ?')
          .all(year)
          .map((match) => [match.giver_id, match.receiver_id])
      );

      db.prepare('DELETE FROM matches WHERE year = ?').run(year);

      const insertStmt = db.prepare(
        'INSERT INTO matches (giver_id, receiver_id, year) VALUES (?, ?, ?)'
      );
      for (const match of matchList) {
        insertStmt.run(match.giver_id, match.receiver_id, year);
      }

      // Only the people who got a different recipient see the reveal again
      const resetReveal = db.prepare('UPDATE users SET has_seen_reveal = 0 WHERE id = ?');
      for (const match of matchList) {
        if (previous.get(match.giver_id) !== match.receiver_id) {
          resetReveal.run(match.giver_id);
        }
      }
    });

    updateMatches(currentYear, matches);

    // Return updated matches
    const updatedMatches = db
      .prepare<MatchWithNames, [number]>(
        `SELECT
          m.id,
          m.giver_id,
          m.receiver_id,
          m.year,
          g.name as giver_name,
          g.email as giver_email,
          r.name as receiver_name,
          r.email as receiver_email
        FROM matches m
        JOIN users g ON m.giver_id = g.id
        JOIN users r ON m.receiver_id = r.id
        WHERE m.year = ?
        ORDER BY g.name`
      )
      .all(currentYear);

    res.json({
      year: currentYear,
      matches: updatedMatches.map((m: MatchWithNames) => ({
        id: m.id,
        giver: {
          id: m.giver_id,
          name: m.giver_name,
          email: m.giver_email,
        },
        receiver: {
          id: m.receiver_id,
          name: m.receiver_name,
          email: m.receiver_email,
        },
      })),
    });

  } catch (error) {
    console.error('Update matches error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
