import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailCampaign extends Document {
  name: string;
  email: string;
  templateId: mongoose.Types.ObjectId;
  startDateTime: Date;
  endDateTime: Date;
  sendTime: string; // Format: "HH:mm"
  lastSentAt?: Date;
  isActive: boolean;
}

const EmailCampaignSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  templateId: { type: Schema.Types.ObjectId, ref: 'Template', required: true },
  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date, required: true },
  sendTime: { type: String, required: true, default: "09:00" },
  lastSentAt: { type: Date },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model<IEmailCampaign>('EmailCampaign', EmailCampaignSchema);
