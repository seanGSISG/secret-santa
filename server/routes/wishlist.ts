import { Router } from 'express';
import { db, WishlistItem, Match, User } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';
import { fetchProductInfo } from '../utils/amazon.js';
import { sendWishlistUpdateEmail } from '../services/email.js';
import { isWishlistEnabled } from '../utils/features.js';

const router = Router();

router.use((_req, res, next) => {
  if (!isWishlistEnabled()) {
    res.status(404).json({ error: 'Wishlist feature is disabled' });
    return;
  }
  next();
});

/**
 * GET /api/wishlist
 * Get current user's wishlist items
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;

    const items = db
      .prepare<[number], WishlistItem>(
        'SELECT * FROM wishlist_items WHERE user_id = ? ORDER BY added_at DESC'
      )
      .all(userId);

    res.json(
      items.map((item: WishlistItem) => ({
        id: item.id,
        userId: item.user_id,
        amazonUrl: item.amazon_url,
        title: item.title,
        imageUrl: item.image_url,
        price: item.price,
        addedAt: item.added_at,
      }))
    );
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/wishlist
 * Add item to wishlist (fetches Amazon product info)
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { amazonUrl } = req.body;

    if (!amazonUrl || typeof amazonUrl !== 'string') {
      res.status(400).json({ error: 'Amazon URL required' });
      return;
    }

    // Sanitize URL input
    const sanitizedUrl = amazonUrl.trim();

    // Validate URL format
    let parsedUrl;
    try {
      parsedUrl = new URL(sanitizedUrl);
    } catch {
      res.status(400).json({ error: 'Invalid URL format' });
      return;
    }

    // Validate it's an Amazon URL (more strict check)
    const validAmazonDomains = ['amazon.com', 'www.amazon.com', 'smile.amazon.com'];
    if (!validAmazonDomains.includes(parsedUrl.hostname.toLowerCase())) {
      res.status(400).json({ error: 'Must be an Amazon.com URL' });
      return;
    }

    // Validate HTTPS
    if (parsedUrl.protocol !== 'https:') {
      res.status(400).json({ error: 'URL must use HTTPS' });
      return;
    }

    // Fetch product info from Amazon
    const productInfo = await fetchProductInfo(sanitizedUrl);

    // Insert into database
    const result = db
      .prepare(
        'INSERT INTO wishlist_items (user_id, amazon_url, title, image_url, price) VALUES (?, ?, ?, ?, ?)'
      )
      .run(userId, sanitizedUrl, productInfo.title, productInfo.imageUrl, productInfo.price);

    // Get the inserted item
    const item = db
      .prepare<[number], WishlistItem>('SELECT * FROM wishlist_items WHERE id = ?')
      .get(result.lastInsertRowid as number);

    if (!item) {
      res.status(500).json({ error: 'Failed to retrieve item' });
      return;
    }

    // Send email notification to the Santa
    try {
      // Find who is the Santa for this user (giver)
      const currentYear = new Date().getFullYear();
      const match = db
        .prepare<[number, number], Match>(
          'SELECT * FROM matches WHERE receiver_id = ? AND year = ?'
        )
        .get(userId, currentYear);

      if (match) {
        // Get Santa's email
        const santa = db
          .prepare<[number], User>('SELECT * FROM users WHERE id = ?')
          .get(match.giver_id);

        // Get user's name (giftee)
        const giftee = db
          .prepare<[number], User>('SELECT * FROM users WHERE id = ?')
          .get(userId);

        if (santa && giftee && santa.email) {
          console.log(`Sending wishlist update email to ${santa.email}...`);
          // Don't await this to avoid blocking the response
          sendWishlistUpdateEmail(santa.email, santa.name, giftee.name, productInfo.title || 'New Item')
            .then(() => console.log(`Wishlist email sent to ${santa.email}`))
            .catch(e => console.error('Failed to send wishlist email', e));
        } else {
          console.warn('Skipping wishlist email: Santa or email not found');
        }
      }
    } catch (emailError) {
      console.error('Error sending wishlist email:', emailError);
      // Continue execution, don't fail the request
    }

    res.status(201).json({
      id: item.id,
      userId: item.user_id,
      amazonUrl: item.amazon_url,
      title: item.title,
      imageUrl: item.image_url,
      price: item.price,
      addedAt: item.added_at,
    });
  } catch (error) {
    console.error('Add wishlist item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/wishlist/recipient
 * Get recipient's wishlist
 */
router.get('/recipient', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const currentYear = new Date().getFullYear();

    // Get match for current year
    const match = db
      .prepare<[number, number], Match>(
        'SELECT * FROM matches WHERE giver_id = ? AND year = ?'
      )
      .get(userId, currentYear);

    if (!match) {
      res.status(404).json({ error: 'No match assigned yet' });
      return;
    }

    // Get recipient's user information
    const recipient = db
      .prepare<[number], User>('SELECT * FROM users WHERE id = ?')
      .get(match.receiver_id);

    if (!recipient) {
      res.status(500).json({ error: 'Recipient not found' });
      return;
    }

    // Get recipient's wishlist
    const items = db
      .prepare<[number], WishlistItem>(
        'SELECT * FROM wishlist_items WHERE user_id = ? ORDER BY added_at DESC'
      )
      .all(match.receiver_id);

    res.json({
      recipient: {
        name: recipient.name,
      },
      items: items.map((item: WishlistItem) => ({
        id: item.id,
        userId: item.user_id,
        amazonUrl: item.amazon_url,
        title: item.title,
        imageUrl: item.image_url,
        price: item.price,
        addedAt: item.added_at,
      })),
    });
  } catch (error) {
    console.error('Get recipient wishlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/wishlist/:id
 * Remove item from wishlist (only own items)
 */
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const itemId = parseInt(req.params.id, 10);

    if (isNaN(itemId)) {
      res.status(400).json({ error: 'Invalid item ID' });
      return;
    }

    // Verify item belongs to user
    const item = db
      .prepare<[number], WishlistItem>('SELECT * FROM wishlist_items WHERE id = ?')
      .get(itemId);

    if (!item) {
      res.status(404).json({ error: 'Item not found' });
      return;
    }

    if (item.user_id !== userId) {
      res.status(403).json({ error: 'Cannot delete another user\'s item' });
      return;
    }

    // Delete item
    db.prepare('DELETE FROM wishlist_items WHERE id = ?').run(itemId);

    res.json({ success: true });
  } catch (error) {
    console.error('Delete wishlist item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
