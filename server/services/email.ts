import nodemailer from "nodemailer";
import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { User } from "../db/database.js";
import { isWishlistEnabled } from "../utils/features.js";
import type { Language } from "../utils/language.js";

let transporter: nodemailer.Transporter | null = null;
const templateCache = new Map<string, string>();
const moduleDirectory = dirname(fileURLToPath(import.meta.url));

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

function getTemplatePath(templateName: string, language: Language): string {
  const filename = `${templateName}.${language}.html`;
  const candidates = [
    join(moduleDirectory, "../templates/emails", filename),
    join(moduleDirectory, "../../templates/emails", filename),
  ];
  const templatePath = candidates.find((candidate) => existsSync(candidate));

  if (!templatePath) {
    throw new Error(`Email template "${filename}" was not found.`);
  }

  return templatePath;
}

function escapeHtml(value: string): string {
  const escapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return value.replace(/[&<>"']/g, (character) => escapes[character]);
}

function renderEmailTemplate(
  templateName: string,
  language: Language,
  variables: Record<string, string | boolean>,
): { subject: string; html: string } {
  const templatePath = getTemplatePath(templateName, language);
  let template = templateCache.get(templatePath);

  if (template === undefined) {
    template = readFileSync(templatePath, "utf8");
    templateCache.set(templatePath, template);
  }

  const rendered = template
    .replace(/\{\{#if ([a-zA-Z0-9_]+)}}([\s\S]*?)\{\{\/if}}/g, (_match, variable: string, content: string) => {
      const value = variables[variable];
      if (value === undefined) {
        throw new Error(`Missing email template condition "${variable}" in ${templatePath}.`);
      }
      return value ? content : "";
    })
    .replace(/\{\{\s*([a-zA-Z0-9_]+)\s*}}/g, (_match, variable: string) => {
      const value = variables[variable];
      if (typeof value !== "string") {
        throw new Error(`Missing email template value "${variable}" in ${templatePath}.`);
      }
      return escapeHtml(value);
    });

  const unresolvedToken = rendered.match(/\{\{[\s\S]*?\}\}/);
  if (unresolvedToken) {
    throw new Error(`Unknown email template token "${unresolvedToken[0]}" in ${templatePath}.`);
  }

  const subjectMatch = rendered.match(/<title>([\s\S]*?)<\/title>/i);
  if (!subjectMatch) {
    throw new Error(`Email template "${templatePath}" must contain a <title> subject.`);
  }

  return {
    subject: subjectMatch[1]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim(),
    html: rendered,
  };
}

export async function sendRegistrationPasswordEmail(
  toEmail: string,
  name: string,
  password: string,
  language: Language,
  secondhandPreference: boolean,
) {
  const template = renderEmailTemplate("registration", language, {
    name,
    password,
    secondhandPreference,
    loginUrl: `${process.env.CLIENT_URL || "http://localhost:5173"}/connexion`,
  });
  const info = await getTransporter().sendMail({
    from: getFromAddress(),
    to: toEmail,
    subject: template.subject,
    html: template.html,
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
  language: Language,
  recipientPrefersSecondhand: boolean,
) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email credentials not set. Skipping match email.");
    return;
  }

  const appUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const template = renderEmailTemplate("match", language, {
    name: toUser.name,
    matchName,
    matchEmail,
    appUrl,
    wishlistEnabled: isWishlistEnabled(),
    recipientPrefersSecondhand,
    recipientDoesNotPreferSecondhand: !recipientPrefersSecondhand,
  });

  try {
    const info = await getTransporter().sendMail({
      from: getFromAddress(),
      to: toUser.email,
      subject: template.subject,
      html: template.html,
    });
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
  language: Language,
) {
  if (!isWishlistEnabled()) {
    return;
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email credentials not set. Skipping wishlist email.");
    return;
  }

  const appUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const template = renderEmailTemplate("wishlist-update", language, {
    santaName,
    gifteeName,
    itemTitle,
    loginUrl: `${appUrl}/connexion`,
  });

  try {
    const info = await getTransporter().sendMail({
      from: getFromAddress(),
      to: santaEmail,
      subject: template.subject,
      html: template.html,
    });
    console.log("Wishlist update email sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending wishlist email:", error);
    throw error;
  }
}

/**
 * Send a welcome email to a new user
 */
export async function sendWelcomeEmail(
  toEmail: string,
  name: string,
  password?: string,
  language: Language = "fr",
) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email credentials not set. Skipping welcome email.");
    return;
  }

  const appUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const template = renderEmailTemplate("welcome", language, {
    name,
    password: password ?? "",
    appUrl: `${appUrl}/connexion`,
    passwordProvided: Boolean(password),
    wishlistEnabled: isWishlistEnabled(),
  });

  try {
    const info = await getTransporter().sendMail({
      from: getFromAddress(),
      to: toEmail,
      subject: template.subject,
      html: template.html,
    });
    console.log("Welcome email sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw error;
  }
}

export async function sendAccountDeletedEmail(
  toEmail: string,
  name: string,
  language: Language,
) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email credentials not set. Skipping account deletion email.");
    return;
  }

  const template = renderEmailTemplate("account-deleted", language, { name });

  try {
    const info = await getTransporter().sendMail({
      from: getFromAddress(),
      to: toEmail,
      subject: template.subject,
      html: template.html,
    });
    console.log("Account deletion email sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending account deletion email:", error);
    throw error;
  }
}
