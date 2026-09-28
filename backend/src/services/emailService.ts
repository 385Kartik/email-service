import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (to: string, name: string, customSubject?: string, customMessage?: string, context?: { endDate?: Date | string }) => {
  // Calculate remaining days if context is provided
  let remainingDays = 0;
  if (context?.endDate) {
    const diff = new Date(context.endDate).getTime() - new Date().getTime();
    remainingDays = Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  }

  const defaultSubject = `Daily Update for ${name}`;
  const defaultMessage = `Hi ${name},\n\nThis is your customized daily email.\n\nBest regards,\nTeam`;

  const finalSubject = (customSubject || defaultSubject)
    .replace(/\{\{\s*name\s*\}\}/gi, name)
    .replace(/\{\{\s*email\s*\}\}/gi, to)
    .replace(/\{\{\s*remaining_days\s*\}\}/gi, remainingDays.toString());

  const finalMessage = (customMessage || defaultMessage)
    .replace(/\{\{\s*name\s*\}\}/gi, name)
    .replace(/\{\{\s*email\s*\}\}/gi, to)
    .replace(/\{\{\s*remaining_days\s*\}\}/gi, remainingDays.toString());

  const mailOptions = {
    from: `Devoraaa <${process.env.EMAIL_USER}>`,
    to: to,
    subject: finalSubject,
    text: finalMessage,
    // html: finalMessage.replace(/\n/g, '<br>') // Convert newlines to HTML line breaks if needed
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent to ' + to + ': ' + info.response);
    return info;
  } catch (error) {
    console.error('❌ Error sending email to ' + to, error);
    throw error;
  }
};
