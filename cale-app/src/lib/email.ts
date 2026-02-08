import nodemailer from 'nodemailer';

type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
};

const getSmtpConfig = (): SmtpConfig | null => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM;

  if (!host || !port || !user || !pass || !from) return null;

  return {
    host,
    port: Number(port),
    user,
    pass,
    from
  };
};

export const sendPasswordResetEmail = async (to: string, resetLink: string) => {
  const config = getSmtpConfig();
  if (!config) {
    throw new Error('SMTP is not configured');
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass
    }
  });

  await transporter.sendMail({
    from: config.from,
    to,
    subject: 'Recuperar contrasena - CALE',
    text: `Recibimos una solicitud para restablecer tu contrasena.\n\nAbre este enlace para continuar: ${resetLink}\n\nSi no lo solicitaste, puedes ignorar este mensaje.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #0f172a;">
        <h2 style="margin: 0 0 12px;">Recuperar contrasena</h2>
        <p style="margin: 0 0 12px;">Recibimos una solicitud para restablecer tu contrasena.</p>
        <p style="margin: 0 0 16px;">Abre este enlace para continuar:</p>
        <p style="margin: 0 0 16px;"><a href="${resetLink}">${resetLink}</a></p>
        <p style="margin: 0; color: #475569;">Si no lo solicitaste, puedes ignorar este mensaje.</p>
      </div>
    `
  });
};
