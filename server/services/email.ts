import nodemailer from 'nodemailer';

/**
 * Escape a value for use in HTML. Names and product titles come from users,
 * so they must not be able to add links or scripts to an email.
 */
function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return value.replace(/[&<>"']/g, (character) => entities[character]);
}

// Create a transporter using Gmail
// Note: Requires App Password if 2FA is enabled (recommended)
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
}

/**
 * Build the app link that emails use. Only the server sets this address.
 */
function appUrl(path = ''): string {
  return `${process.env.CLIENT_URL || 'http://localhost:5173'}${path}`;
}

/**
 * Wrap a title and a text in the email layout
 */
function layout(title: string, body: string): string {
  return `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a472a; font-size: 28px;">${title}</h1>
        ${body}
        <p style="color: #888; font-size: 12px; margin-top: 32px;">This message came from a Secret Santa exchange. If you did not expect it, you can ignore it.</p>
      </div>
    `;
}

/**
 * Send an email to a user to say that their Secret Santa match is ready.
 * No email ever names the person a Santa buys for: the name shows only in the
 * app, after the reveal. An inbox is not a secret place.
 */
export async function sendMatchEmail(toUser: { name: string; email: string }) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not set. Skipping match email.');
    return;
  }

  const mailOptions = {
    from: `"Secret Santa" <${process.env.EMAIL_USER}>`,
    to: toUser.email,
    subject: 'Your Secret Santa match is ready',
    html: layout(
      `Ho ho ho, ${escapeHtml(toUser.name)}!`,
      `<p>The elves have done their magic, and your Secret Santa match is waiting for you.</p>
       <p style="font-size: 18px; background-color: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #1a472a; text-align: center;">
         <a href="${appUrl('/match')}" style="color: #1a472a; font-weight: bold;">Open the app to see who you are buying for</a>
       </p>
       <p>Only you can see your match. Keep it secret until the exchange.</p>
       <p>Merry Christmas!</p>`
    ),
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);
    console.log('Match email sent:', toUser.email, info.messageId);
  } catch (error) {
    console.error('Error sending match email:', error);
    throw error;
  }
}

/**
 * Send an email to a Santa when their person adds a wishlist item.
 * The email calls that person "your person" and does not use their name.
 */
export async function sendWishlistUpdateEmail(santaEmail: string, santaName: string, itemTitle: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not set. Skipping wishlist email.');
    return;
  }

  const mailOptions = {
    from: `"Secret Santa" <${process.env.EMAIL_USER}>`,
    to: santaEmail,
    subject: 'A new wishlist idea from your person',
    html: layout(
      `Hello ${escapeHtml(santaName)}!`,
      `<p>The person you are buying for added an idea to their wishlist:</p>
       <p style="font-size: 16px; font-weight: bold; color: #8b1538;">${escapeHtml(itemTitle)}</p>
       <p>See the full wishlist in the <a href="${appUrl('/recipient')}" style="color: #1a472a; font-weight: bold;">Secret Santa app</a>.</p>
       <p>Happy gifting!</p>`
    ),
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);
    console.log('Wishlist update email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending wishlist email:', error);
    throw error;
  }
}

/**
 * Send a welcome email to a new user. The password is never in this email:
 * the organizer gives the password to the person directly.
 */
export async function sendWelcomeEmail(toEmail: string, name: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not set. Skipping welcome email.');
    return;
  }

  const mailOptions = {
    from: `"Secret Santa" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Welcome to Secret Santa!',
    html: layout(
      `Welcome, ${escapeHtml(name)}!`,
      `<p>You are invited to a Secret Santa gift exchange.</p>
       <p>Your organizer will give you your sign-in details.</p>
       <p>Sign in at the <a href="${appUrl()}" style="color: #8b1538; font-weight: bold;">Secret Santa app</a> to open your match and to write your wishlist.</p>
       <p>Happy Holidays!</p>`
    ),
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
}
