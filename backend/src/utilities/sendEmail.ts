import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const sendEmail = async ({ to, subject, html }: EmailOptions): Promise<void> => {
  const port = Number(process.env.EMAIL_PORT);

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"HRMS" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

export default sendEmail;