import { createTransport } from "nodemailer";

export { sendMail };

const transporter = createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: process.env.EMAIL_SMTP_PORT,
  secure: process.env.NODE_ENV === "production",
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASS,
  },
});

async function sendMail(mailOptions) {
  await transporter.sendMail(mailOptions);
}
