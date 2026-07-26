import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY non configurée — email "${subject}" à ${to} non envoyé.`);
    return;
  }

  try {
    await resend.emails.send({
      from: "Jersey Run <no-reply@jerseyrun.re>",
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error(`[email] Échec de l'envoi à ${to}:`, error);
  }
}

export async function notifyAdmin({ subject, html }: { subject: string; html: string }): Promise<void> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  if (!adminEmail) {
    console.warn(`[email] ADMIN_NOTIFICATION_EMAIL non configurée — notification "${subject}" non envoyée.`);
    return;
  }
  await sendEmail({ to: adminEmail, subject: `[Jersey Run] ${subject}`, html });
}
