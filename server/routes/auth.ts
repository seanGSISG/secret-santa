import { Router } from 'express';
import { randomUUID } from 'crypto';
import { db, User } from '../db/database.js';
import { verifyPassword, UNKNOWN_USER_HASH } from '../utils/password.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const SESSION_DURATION_DAYS = 7;
const LOGIN_MAX_FAILURES = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

/**
 * Email validation regex - RFC 5322 compliant basic pattern
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Failed sign-in attempts per email address, with the time when the count resets.
 * The map lives in memory, so the count starts again when the server restarts.
 */
const loginFailures = new Map<string, { count: number; resetAt: number }>();

/**
 * Report whether an email address is blocked after too many failed sign-ins.
 */
function isLoginBlocked(email: string): boolean {
  const failures = loginFailures.get(email);
  if (!failures) return false;

  if (Date.now() >= failures.resetAt) {
    loginFailures.delete(email);
    return false;
  }

  return failures.count >= LOGIN_MAX_FAILURES;
}

/**
 * Count one failed sign-in for an email address.
 */
function recordLoginFailure(email: string): void {
  const now = Date.now();
  const failures = loginFailures.get(email);

  if (!failures || now >= failures.resetAt) {
    loginFailures.set(email, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  } else {
    failures.count += 1;
  }
}

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    // Sanitize email input
    const sanitizedEmail = email.trim().toLowerCase();

    if (isLoginBlocked(sanitizedEmail)) {
      res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
      return;
    }

    // Validate email format
    if (!EMAIL_REGEX.test(sanitizedEmail)) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Find user by email
    const user = db
      .prepare<User, [string]>('SELECT * FROM users WHERE email = ?')
      .get(sanitizedEmail);

    // Verify a hash also when the email is unknown, so that the response time
    // does not show which email addresses have an account.
    const isValid = await verifyPassword(password, user?.password_hash ?? UNKNOWN_USER_HASH);

    if (!user || !isValid) {
      recordLoginFailure(sanitizedEmail);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    loginFailures.delete(sanitizedEmail);

    // Create session
    const sessionId = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

    db.prepare(
      'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
    ).run(sessionId, user.id, expiresAt.toISOString());

    // Set httpOnly cookie
    res.cookie('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });

    // Return user info (without password hash)
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: !!user.is_admin,
        hasSeenReveal: !!user.has_seen_reveal,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout
 * Logout and clear session
 */
router.post('/logout', async (req, res) => {
  try {
    const sessionId = req.cookies.session_id;

    if (sessionId) {
      // Delete session from database
      db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    }

    // Clear cookie
    res.clearCookie('session_id');

    res.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = req.user!;

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: !!user.is_admin,
        hasSeenReveal: !!user.has_seen_reveal,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
