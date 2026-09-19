import dotenv from 'dotenv'

dotenv.config()

export default async function sendEmail(to, subject, htmlContent) {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': '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',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        name: 'Elite Lifts',
        email: 'thisisjeffry77@gmail.com',
      },
      to: [{ email: to }],
      subject,
      htmlContent,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Email sending failed');
  }

  return result;
}