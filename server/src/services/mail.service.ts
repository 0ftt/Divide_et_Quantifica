import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (transporter) {
    return transporter;
  }
  if (!env.mailUser || !env.mailPass) {
    return null;
  }
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: env.mailUser, pass: env.mailPass },
  });
  return transporter;
}

export async function sendMail(to: string, subject: string, html: string): Promise<void> {
  const tx = getTransporter();
  if (!tx) {
    console.warn(`[mail] credenziali mancanti: email "${subject}" non inviata a ${to}`);
    return;
  }
  try {
    await tx.sendMail({ from: env.mailFrom || env.mailUser, to, subject, html });
  } catch (err) {
    console.error('[mail] invio fallito:', err);
  }
}

export function emailLayout(title: string, bodyHtml: string): string {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; background:#0a0f1e; padding:24px; color:#e2e8f0;">
    <div style="max-width:480px; margin:0 auto; background:#111a2e; border:1px solid #1c2b45; border-radius:12px; padding:24px;">
      <h1 style="color:#01B7C6; font-size:20px; margin:0 0 16px;">Divide et Quantifica</h1>
      <h2 style="color:#e2e8f0; font-size:16px; margin:0 0 12px;">${title}</h2>
      <div style="font-size:14px; line-height:1.6; color:#cbd5e1;">${bodyHtml}</div>
      <p style="margin-top:24px; font-size:12px; color:#64748b;">Trading simulato · nessun pagamento reale.</p>
    </div>
  </div>`;
}
