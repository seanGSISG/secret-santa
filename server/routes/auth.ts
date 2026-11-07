import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, User, Session } from '../db/database.js';
import { generatePassword, hashPassword, verifyPassword } from '../utils/password.js';
import { requireAuth } from '../middleware/auth.js';
import { sendRegistrationPasswordEmail } from '../services/email.js';

const router = Router();

const SESSION_DURATION_DAYS = 7;

/**
 * Email validation regex - RFC 5322 compliant basic pattern
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/register
 * Create an account or reset an existing account's password by email
 */
router.post('/register', async (req, res) => {
  const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAINS || '')
    .split(',')
    .map((domain) => domain.trim().toLowerCase().replace(/^@/, ''))
    .filter(Boolean);

  if (allowedDomains.length === 0) {
    res.status(503).json({ error: 'Registration is not configured' });
    return;
  }

  const { email, name } = req.body ?? {};
  if (typeof email !== 'string' || typeof name !== 'string') {
    res.status(400).json({ error: 'Email and name are required' });
    return;
  }

  const sanitizedEmail = email.trim().toLowerCase();
  const sanitizedName = name.trim();

  if (sanitizedEmail.length > 254 || !EMAIL_REGEX.test(sanitizedEmail)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }

  if (!sanitizedName || sanitizedName.length > 100) {
    res.status(400).json({ error: 'Name must be between 1 and 100 characters' });
    return;
  }

  const emailDomain = sanitizedEmail.slice(sanitizedEmail.lastIndexOf('@') + 1);
  if (!allowedDomains.includes(emailDomain)) {
    res.status(403).json({ error: 'Registrations from this email domain are not allowed' });
    return;
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    res.status(503).json({ error: 'Email is not configured; registration is unavailable' });
    return;
  }

  try {
    const existingUser = db
      .prepare<[string], User>('SELECT * FROM users WHERE email = ?')
      .get(sanitizedEmail);
    const password = generatePassword();
    const passwordHash = await hashPassword(password);
    let userId: number;

    if (existingUser) {
      userId = existingUser.id;
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        .run(passwordHash, userId);
    } else {
      const result = db
        .prepare('INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)')
        .run(sanitizedEmail, passwordHash, sanitizedName);
      userId = Number(result.lastInsertRowid);
    }

    try {
      await sendRegistrationPasswordEmail(sanitizedEmail, existingUser?.name ?? sanitizedName, password);
    } catch (emailError) {
      console.error('Registration email error:', emailError);

      try {
        if (existingUser) {
          db.prepare('UPDATE users SET password_hash = ? WHERE id = ? AND password_hash = ?')
            .run(existingUser.password_hash, userId, passwordHash);
        } else {
          db.prepare('DELETE FROM users WHERE id = ?').run(userId);
        }
      } catch (rollbackError) {
        console.error('Failed to restore account after registration email error:', rollbackError);
      }

      res.status(502).json({ error: 'Could not send the welcome email. Please try again later.' });
      return;
    }

    if (existingUser) {
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
    }

    res.json({ message: 'Check your email for your Secret Santa password.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password required' });
      return;
    }

    // Sanitize email input
    const sanitizedEmail = email.trim().toLowerCase();

    // Validate email format
    if (!EMAIL_REGEX.test(sanitizedEmail)) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Find user by email
    const user = db
      .prepare<[string], User>('SELECT * FROM users WHERE email = ?')
      .get(sanitizedEmail);

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Create session
    const sessionId = uuidv4();
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
