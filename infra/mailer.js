import { createTransport } from "nodemailer";
import { ServiceError } from "infra/errors.js";

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
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new ServiceError({
      cause: error,
      message: "Erro ao enviar email.",
      action: "Verifique se o serviço de email está disponível.",
      context: mailOptions,
    });
  }
}
