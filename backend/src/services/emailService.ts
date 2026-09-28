import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import Settings from '../models/Settings.js';
dotenv.config();

export const sendEmail = async (to: string, name: string, customSubject?: string, customMessage?: string, context?: { endDate?: Date | string }) => {
  // Fetch settings from DB
  const settings = await Settings.findOne();
  
  let user = process.env.EMAIL_USER;
  let pass = process.env.EMAIL_PASS;
  let senderName = 'Devoraaa';

  if (settings && settings.smtpEmail && settings.smtpPassword) {
    user = settings.smtpEmail;
    pass = settings.smtpPassword;
    if (settings.senderName) senderName = settings.senderName;
  }

  if (!user || !pass) {
    throw new Error('Email sending failed: SMTP credentials are not set in the Settings tab.');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: user,
      pass: pass,
    },
  });

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
    from: `${senderName} <${user}>`,
    to: to,
    subject: finalSubject,
    text: finalMessage,
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
