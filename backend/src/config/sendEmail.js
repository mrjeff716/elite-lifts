import dotenv from 'dotenv'

dotenv.config()

export default async function sendEmail(to, subject, htmlContent) {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
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