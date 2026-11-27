import { Request, Response, NextFunction } from 'express';
import { db, User, Session } from '../db/database.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const SESSION_DURATION_DAYS = 7;

/**
 * Middleware to require authentication
 * Checks for session cookie, validates session, and attaches user to request
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionId = req.cookies.session_id;

    if (!sessionId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    // Get session from database
    const now = new Date().toISOString();
    const session = db
      .prepare<Session, [string, string]>(
        'SELECT * FROM sessions WHERE id = ? AND expires_at > ?'
      )
      .get(sessionId, now);

    if (!session) {
      // Session expired or doesn't exist
      res.clearCookie('session_id');
      res.status(401).json({ error: 'Session expired' });
      return;
    }

    // Get user from database
    const user = db
      .prepare<User, [number]>('SELECT * FROM users WHERE id = ?')
      .get(session.user_id);

    if (!user) {
      // User doesn't exist (deleted?)
      db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
      res.clearCookie('session_id');
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Middleware to require admin privileges
 * Must be used after requireAuth
 */
export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  if (!req.user.is_admin) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
}

/**
 * Clean up expired sessions (can be called periodically)
 */
export function cleanupExpiredSessions(): void {
  try {
    const now = new Date().toISOString();
    const result = db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now);
    if (result.changes > 0) {
      console.log(`Cleaned up ${result.changes} expired sessions`);
    }
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
  }
}
