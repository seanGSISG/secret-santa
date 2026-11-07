import nodemailer from "nodemailer";
import { User } from "../db/database.js";
import { isWishlistEnabled } from "../utils/features.js";

let transporter: nodemailer.Transporter | null = null;

function getFromAddress(): string {
  const senderAddress = process.env.EMAIL_FROM?.trim() || process.env.EMAIL_USER;
  return `"Secret Santa 🎅" <${senderAddress}>`;
}

function getTransporter() {
  if (!transporter) {
    const auth = {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    };

    transporter = process.env.SMTP_HOST
      ? nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
          secure: process.env.SMTP_SECURE === "true",
          auth,
        })
      : nodemailer.createTransport({
          service: "gmail",
          auth,
        });
  }
  return transporter;
}

export async function sendRegistrationPasswordEmail(toEmail: string, name: string, password: string) {
  const info = await getTransporter().sendMail({
    from: getFromAddress(),
    to: toEmail,
    subject: "Your Secret Santa account password",
    text: `Hello ${name},\n\nYour Secret Santa account is ready. Use this password to sign in: ${password}\n\nIf you already had an account, this password replaces your previous one.\n\nIf you did not request this, you can ignore this email.`,
  });
  console.log("Registration password email sent: %s", info.messageId);
}

/**
 * Send an email to a user with their Secret Santa match
 */
export async function sendMatchEmail(
  toUser: User | { name: string; email: string },
  matchName: string,
  matchEmail: string,
) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email credentials not set. Skipping match email.");
    return;
  }

  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  const escapedMatchEmail = matchEmail.replace(/[&<>"']/g, (character) => htmlEscapes[character]);

  const mailOptions = {
    from: getFromAddress(),
    to: toUser.email,
    subject: "Your Secret Santa Match is Here! 🎁",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #c41e3a;">Ho Ho Ho, ${toUser.name}! 🎅</h1>
        <p>The elves have done their magic and your Secret Santa match has been chosen.</p>
        <p style="font-size: 18px; background-color: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #1a472a; text-align: center;">
          You are the Secret Santa for: <strong>${matchName}</strong>! 🎄
        </p>
        <p>Email: <a href="mailto:${escapedMatchEmail}">${escapedMatchEmail}</a></p>
        <p>Visit the <a href="${process.env.CLIENT_URL || "http://localhost:5173"}" style="color: #1a472a; font-weight: bold;">Secret Santa App</a>${isWishlistEnabled() ? " to see their wishlist and get gift ideas" : ""}.</p>
        <p>Merry Christmas!</p>
      </div>
    `,
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);
    console.log("Match email sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending match email:", error);
    throw error;
  }
}

/**
 * Send an email to a Santa when their match adds a wishlist item
 */
export async function sendWishlistUpdateEmail(
  santaEmail: string,
  santaName: string,
  gifteeName: string,
  itemTitle: string,
) {
  if (!isWishlistEnabled()) {
    return;
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email credentials not set. Skipping wishlist email.");
    return;
  }

  const mailOptions = {
    from: getFromAddress(),
    to: santaEmail,
    subject: `New Wishlist Item from ${gifteeName}! 🎁`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a472a;">Hello ${santaName}! 🦌</h2>
        <p><strong>${gifteeName}</strong> just added a new item to their wishlist:</p>
        <p style="font-size: 16px; font-weight: bold; color: #c41e3a;">${itemTitle}</p>
        <p>Check it out on their <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/match" style="color: #1a472a; font-weight: bold;">Wishlist</a>.</p>
        <p>Happy Gifting!</p>
      </div>
    `,
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);
    console.log("Wishlist update email sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending wishlist email:", error);
    throw error;
  }
}

/**
 * Send a welcome email to a new user
 */
export async function sendWelcomeEmail(toEmail: string, name: string, password?: string) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email credentials not set. Skipping welcome email.");
    return;
  }

  const mailOptions = {
    from: getFromAddress(),
    to: toEmail,
    subject: "Welcome to Secret Santa! 🎄",
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a472a;">Welcome, ${name}! 🦌</h1>
        <p>You have been invited to the Secret Santa Gift Exchange.</p>
        ${
          password
            ? `<p>Your temporary password is: <strong style="font-size: 18px; background-color: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${password}</strong></p>`
            : ""
        }
        <p>Please log in at <a href="${process.env.CLIENT_URL || "http://localhost:5173"}" style="color: #c41e3a; font-weight: bold;">Secret Santa App</a> to reset your password${isWishlistEnabled() ? " and create your wishlist" : ""}.</p>
        <p>Happy Holidays!</p>
      </div>
    `,
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);
    console.log("Welcome email sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw error;
  }
}
