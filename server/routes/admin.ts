import { Router } from 'express';
import { db, User } from '../db/database.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { generatePassword, hashPassword } from '../utils/password.js';
import { sendMatchEmail, sendWelcomeEmail } from '../services/email.js';
import { createDrawAssignments } from '../utils/matching.js';

const router = Router();

/**
 * Email validation regex - RFC 5322 compliant basic pattern
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// All admin routes require authentication and admin privileges
router.use(requireAuth);
router.use(requireAdmin);

router.put('/draw-participation', async (req, res) => {
  const { participatesInDraw } = req.body ?? {};
  if (typeof participatesInDraw !== 'boolean') {
    res.status(400).json({ error: 'Draw participation must be a boolean' });
    return;
  }

  try {
    const user = req.user!;
    const nextValue = participatesInDraw ? 1 : 0;
    if (user.participates_in_draw !== nextValue) {
      const currentYear = new Date().getFullYear();
      const updateParticipation = db.transaction(() => {
        db.prepare('UPDATE users SET participates_in_draw = ? WHERE id = ?')
          .run(nextValue, user.id);
        db.prepare('DELETE FROM matches WHERE year = ?').run(currentYear);
        db.prepare('UPDATE users SET has_seen_reveal = 0').run();
      });
      updateParticipation();
    }

    res.json({ participatesInDraw });
  } catch (error) {
    console.error('Update draw participation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/users
 * List all users
 */

// Test email route (Debug only)
router.post('/test-email', async (req, res) => {
  try {
    console.log('Inside test-email route', req.body);
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'Email required' });
      return;
    }

    console.log(`Testing email to ${email}...`);
    // Dynamic import to ensure we get the latest version if hot-reloaded (though standard import is fine usually)
    const { sendWelcomeEmail } = await import('../services/email.js');
    await sendWelcomeEmail(email, 'Test User');
    res.json({ success: true, message: 'Email queued' });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ error: String(error) });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = db.prepare<[], User>('SELECT * FROM users ORDER BY name').all();

    res.json({
      users: users.map((user: User) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: !!user.is_admin,
        hasSeenReveal: !!user.has_seen_reveal,
        language: user.language,
        secondhandPreference: !!user.secondhand_preference,
        participatesInDraw: !!user.participates_in_draw,
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
    const { email, name, isAdmin, password: manualPassword } = req.body;

    // Validate required fields
    if (!email || !name) {
      res.status(400).json({ error: 'Email and name required' });
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
      .prepare<[string], User>('SELECT * FROM users WHERE email = ?')
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
      .run(sanitizedEmail, passwordHash, sanitizedName, isAdmin ? 1 : 0);

    // Get created user
    const user = db
      .prepare<[number], User>('SELECT * FROM users WHERE id = ?')
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
        language: user.language,
        secondhandPreference: !!user.secondhand_preference,
        participatesInDraw: !!user.participates_in_draw,
        createdAt: user.created_at,
      },
      password, // Return plaintext password only on creation
    });

    // Send welcome email asynchronously
    (async () => {
      try {
        console.log(`Sending welcome email to ${user.email}...`);
        await sendWelcomeEmail(user.email, user.name, password, user.language);
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
    const user = db.prepare<[number], User>('SELECT * FROM users WHERE id = ?').get(userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Delete user (cascading will handle related records via foreign keys)
    // But SQLite doesn't cascade by default, so delete manually
    // Use transaction to ensure atomicity
    const deleteUserAndRelatedData = db.transaction((userId: number) => {
      db.prepare('DELETE FROM wishlist_items WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM matches WHERE giver_id = ? OR receiver_id = ?').run(userId, userId);
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    });

    deleteUserAndRelatedData(userId);

    res.json({ success: true });
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
    const { name, email } = req.body;

    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    // Check if user exists
    const user = db.prepare<[number], User>('SELECT * FROM users WHERE id = ?').get(userId);

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
        .prepare<[string, number], User>(
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
      .prepare<[number], User>('SELECT * FROM users WHERE id = ?')
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
        language: updatedUser.language,
        secondhandPreference: !!updatedUser.secondhand_preference,
        participatesInDraw: !!updatedUser.participates_in_draw,
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
    const user = db.prepare<[number], User>('SELECT * FROM users WHERE id = ?').get(userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Generate new password
    const password = generatePassword();
    const passwordHash = await hashPassword(password);

    // Update password
    db.prepare('UPDATE users SET password_hash = ?, has_seen_reveal = 0 WHERE id = ?').run(
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
  giver_language: 'fr' | 'en';
  receiver_name: string;
  receiver_email: string;
  receiver_secondhand_preference: number;
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
      .prepare<[number], MatchWithNames>(
        `SELECT
          m.id,
          m.giver_id,
          m.receiver_id,
          m.year,
          g.name as giver_name,
          g.email as giver_email,
          g.language as giver_language,
          r.name as receiver_name,
          r.email as receiver_email,
          r.secondhand_preference as receiver_secondhand_preference
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
    const users = db
      .prepare<[], User>('SELECT * FROM users WHERE participates_in_draw = 1 ORDER BY RANDOM()')
      .all();

    if (users.length < 2) {
      res.status(400).json({ error: 'Need at least 2 users to generate matches' });
      return;
    }

    const matches = createDrawAssignments(users);

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
      .prepare<[number], MatchWithNames>(
        `SELECT
          m.id,
          m.giver_id,
          m.receiver_id,
          m.year,
          g.name as giver_name,
          g.email as giver_email,
          g.language as giver_language,
          r.name as receiver_name,
          r.email as receiver_email,
          r.secondhand_preference as receiver_secondhand_preference
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
        console.log(`Starting to send match emails to ${createdMatches.length} matches...`);
        // Send emails to all givers
        for (const match of createdMatches) {
          if (match.giver_email) {
            console.log(`Sending match email to ${match.giver_email} (match: ${match.receiver_name})`);
            await sendMatchEmail(
              { name: match.giver_name, email: match.giver_email },
              match.receiver_name,
              match.receiver_email,
              match.giver_language,
              !!match.receiver_secondhand_preference,
            );
          } else {
            console.warn(`Skipping match email for user ${match.giver_id} (no email)`);
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
    const { matches } = req.body; // Array of { giver_id, receiver_id }
    const currentYear = new Date().getFullYear();

    if (!Array.isArray(matches) || matches.length === 0) {
      res.status(400).json({ error: 'Invalid matches data' });
      return;
    }

    const participants = db
      .prepare<[], { id: number }>('SELECT id FROM users WHERE participates_in_draw = 1')
      .all();
    const participantIds = new Set(participants.map((participant) => participant.id));
    const giverIds = new Set<number>();
    const receiverIds = new Set<number>();
    let validParticipantAssignments = matches.length === participants.length;
    for (const match of matches) {
      if (
        !participantIds.has(match.giver_id) ||
        !participantIds.has(match.receiver_id) ||
        match.giver_id === match.receiver_id ||
        giverIds.has(match.giver_id) ||
        receiverIds.has(match.receiver_id)
      ) {
        validParticipantAssignments = false;
        break;
      }
      giverIds.add(match.giver_id);
      receiverIds.add(match.receiver_id);
    }

    if (
      !validParticipantAssignments ||
      giverIds.size !== participants.length ||
      receiverIds.size !== participants.length
    ) {
      res.status(400).json({ error: 'Matches must include all and only participating users' });
      return;
    }

    // Basic validation of input structure
    for (const match of matches) {
      if (!match.giver_id || !match.receiver_id) {
        res.status(400).json({ error: 'Invalid match structure' });
        return;
      }
    }

    // Perform update in transaction
    const updateMatches = db.transaction((year: number, matchList: Array<{ giver_id: number; receiver_id: number }>) => {
      // 1. Delete existing matches for year
      db.prepare('DELETE FROM matches WHERE year = ?').run(year);

      // 2. Insert new matches
      const insertStmt = db.prepare(
        'INSERT INTO matches (giver_id, receiver_id, year) VALUES (?, ?, ?)'
      );

      for (const match of matchList) {
        insertStmt.run(match.giver_id, match.receiver_id, year);
      }

      // 3. Reset reveal status for all users (optional, but good practice if matches change)
      db.prepare('UPDATE users SET has_seen_reveal = 0').run();
    });

    updateMatches(currentYear, matches);

    // Return updated matches
    const updatedMatches = db
      .prepare<[number], MatchWithNames>(
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
