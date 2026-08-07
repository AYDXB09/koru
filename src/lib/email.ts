/**
 * Email delivery abstraction.
 * Console/dev mailbox by default; Resend when RESEND_API_KEY is set.
 * OTP codes and reminders flow through here so swapping providers is trivial.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface EmailSender {
  readonly name: string;
  send(message: EmailMessage): Promise<void>;
}

interface DevMailboxEntry {
  id: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
  sentAt: string;
}

// In-memory mailbox for the local demo (visible on the login page in dev).
const devMailbox: DevMailboxEntry[] = [];
const maxMailbox = 50;

class ConsoleEmailSender implements EmailSender {
  readonly name = "console";

  async send(message: EmailMessage) {
    const entry: DevMailboxEntry = {
      id: `${devMailbox.length + 1}`,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      sentAt: new Date().toISOString(),
    };
    devMailbox.unshift(entry);
    if (devMailbox.length > maxMailbox) devMailbox.length = maxMailbox;
    console.log(`\n[KORU EMAIL] to=${message.to} subject="${message.subject}"\n${message.text}\n`);
  }
}

class ResendEmailSender implements EmailSender {
  readonly name = "resend";

  get available() {
    return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
  }

  async send(message: EmailMessage) {
    if (!this.available) throw new Error("Resend is not configured.");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM,
        to: [message.to],
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend send failed (${res.status}): ${body.slice(0, 300)}`);
    }
  }
}

let cachedSender: EmailSender | null = null;

export function getEmailSender(): EmailSender {
  if (cachedSender) return cachedSender;
  const resend = new ResendEmailSender();
  cachedSender = resend.available ? resend : new ConsoleEmailSender();
  return cachedSender;
}

export function sendEmail(message: EmailMessage): Promise<void> {
  return getEmailSender().send(message);
}
