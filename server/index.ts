import express from 'express'; // Forced reload
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Explicitly load .env from parent directory
dotenv.config({ path: join(__dirname, '../.env') });

// Import database to initialize it
import './db/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import matchRoutes from './routes/match.js';
import wishlistRoutes from './routes/wishlist.js';
import adminRoutes from './routes/admin.js';

// Import middleware for session cleanup
import { cleanupExpiredSessions } from './middleware/auth.js';
import { getPublicConfig } from './utils/publicConfig.js';


const app = express();
const PORT = process.env.PORT || 3001;

// Debug all requests (very first middleware)
app.use((req, res, next) => {
  console.log('[DEBUG] Request:', req.method, req.path);
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

app.get('/api/config', (_req, res) => {
  try {
    res.json(getPublicConfig());
  } catch (error) {
    console.error('Invalid public configuration:', error);
    res.status(500).json({ error: 'La configuration publique du serveur est invalide.' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from client/dist in production
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = join(__dirname, '../client/dist');
  console.log('Static files path:', clientDistPath);
  console.log('Path exists:', existsSync(clientDistPath));

  if (existsSync(clientDistPath)) {
    console.log('Setting up static file serving...');
    app.use(express.static(clientDistPath));

    // Serve index.html for all non-API routes (SPA routing)
    app.get('/', (req, res) => {
      console.log('Root route hit');
      res.sendFile(join(clientDistPath, 'index.html'));
    });
    app.get('*', (req, res) => {
      console.log('Catch-all route hit:', req.path);
      res.sendFile(join(clientDistPath, 'index.html'));
    });
    console.log('Static middleware configured');
  } else {
    console.warn('Client dist directory not found. Run client build first.');
  }
}

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: express.NextFunction
  ) => {
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
    console.log(`Email User: ${process.env.EMAIL_USER || 'NOT SET'}`);
    console.log(`Email Pass Length: ${process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0}`);
  }

  // Clean up expired sessions on startup
  cleanupExpiredSessions();

  // Schedule session cleanup every hour
  setInterval(cleanupExpiredSessions, 60 * 60 * 1000);
});

export default app;
