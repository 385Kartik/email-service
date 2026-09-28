import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailLog extends Document {
  client: mongoose.Types.ObjectId;
  template: mongoose.Types.ObjectId;
  sentAt: Date;
  type: 'PRE_PAYMENT' | 'POST_PAYMENT' | 'OVERDUE';
  status: 'SENT' | 'FAILED';
  errorMsg?: string;
}

const EmailLogSchema: Schema = new Schema({
  client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  template: { type: Schema.Types.ObjectId, ref: 'Template' },
  sentAt: { type: Date, default: Date.now },
  type: { type: String, enum: ['PRE_PAYMENT', 'POST_PAYMENT', 'OVERDUE'], required: true },
  status: { type: String, enum: ['SENT', 'FAILED'], required: true },
  errorMsg: { type: String }
});

export default mongoose.model<IEmailLog>('EmailLog', EmailLogSchema);
