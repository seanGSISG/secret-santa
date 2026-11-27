import { Router } from 'express';
import { db, Match, User } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/match
 * Get current user's Secret Santa match for current year
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const currentYear = new Date().getFullYear();

    // Check if user has seen the reveal before
    const firstTime = !req.user!.has_seen_reveal;

    // Get match for current year
    const match = db
      .prepare<Match, [number, number]>(
        'SELECT * FROM matches WHERE giver_id = ? AND year = ?'
      )
      .get(userId, currentYear);

    if (!match) {
      res.status(404).json({ error: 'No match assigned yet' });
      return;
    }

    // Get recipient info
    const recipient = db
      .prepare<User, [number]>('SELECT * FROM users WHERE id = ?')
      .get(match.receiver_id);

    if (!recipient) {
      res.status(500).json({ error: 'Recipient not found' });
      return;
    }

    // Mark as seen if first time
    if (firstTime) {
      db.prepare('UPDATE users SET has_seen_reveal = 1 WHERE id = ?').run(userId);
    }

    res.json({
      firstTime,
      recipient: {
        id: recipient.id,
        name: recipient.name,
        email: recipient.email,
      },
    });
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
