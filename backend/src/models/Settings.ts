import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  smtpEmail: string;
  smtpPassword: string;
  senderName: string;
}

const SettingsSchema = new Schema({
  smtpEmail: { type: String, default: '' },
  smtpPassword: { type: String, default: '' },
  senderName: { type: String, default: 'Devoraaa' }
});

export default mongoose.model<ISettings>('Settings', SettingsSchema);
