import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));

// The README tells users to create server/.env. Bun loads it only when the process starts in server/.
dotenv.config({ path: join(__dirname, '.env') });

// Import database to initialize it
import './db/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import matchRoutes from './routes/match.js';
import wishlistRoutes from './routes/wishlist.js';
import adminRoutes from './routes/admin.js';

// Import middleware for session cleanup
import { cleanupExpiredSessions } from './middleware/auth.js';

const app = express();
app.disable('x-powered-by');
const PORT = Number(process.env.PORT) || 3001;

// Security headers. The CSP permits the Google Fonts stylesheet that the client imports.
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Request logging (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Unknown API paths return JSON, not the app page
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Serve static files from client/dist in production
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = join(__dirname, '../client/dist');

  if (existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));

    // Serve index.html for all non-API routes (SPA routing)
    app.get('*', (req, res) => {
      res.sendFile(join(clientDistPath, 'index.html'));
    });
  } else {
    console.warn('Client dist directory not found. Run client build first.');
  }
}

// Error handling middleware
app.use(
  (
    err: Error & { type?: string },
    req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: express.NextFunction
  ) => {
    if (err.type === 'entity.parse.failed') {
      res.status(400).json({ error: 'Invalid JSON body' });
      return;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.error('Error:', err);
    }
    res.status(500).json({ error: 'Internal server error' });
  }
);

// Start server
app.listen(PORT, () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  }

  // Clean up expired sessions on startup
  cleanupExpiredSessions();

  // Schedule session cleanup every hour
  setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
});

export default app;
