import cds from '@sap/cds';
const LOG = cds.log('mailer');

export async function sendMail({ to, subject, body }) {
  const mode = cds.env.reminder?.mailMode ?? 'log';

  if (mode === 'log') {
    LOG.info(`\n--- email (not really sent) ---\nTo: ${to}\nSubject: ${subject}\n\n${body}\n-------------------------------`);
    return `logged-${Date.now()}`;
  }

  const api = await cds.connect.to('EMAIL_API');
  await api.send({ method: 'POST', path: '/reminders', data: { to, subject, body } });
  return 'sent-via-EMAIL_API';
}