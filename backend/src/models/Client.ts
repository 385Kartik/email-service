import mongoose, { Document, Schema } from 'mongoose';

export interface IClient extends Document {
  name: string;
  uniqueId: string;
  email: string;
  baseAmount: number;
  uniqueAmount: number;
  dueDate: Date;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  sendTime: string;
  prePaymentTemplate: mongoose.Types.ObjectId;
  postPaymentTemplate: mongoose.Types.ObjectId;
  overdueTemplate: mongoose.Types.ObjectId;
  lastSentAt?: Date;
  createdAt: Date;
}

const ClientSchema: Schema = new Schema({
  name: { type: String, required: true },
  uniqueId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  baseAmount: { type: Number, required: true },
  uniqueAmount: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  status: { type: String, enum: ['PENDING', 'PAID', 'OVERDUE'], default: 'PENDING' },
  sendTime: { type: String, default: '09:00' },
  prePaymentTemplate: { type: Schema.Types.ObjectId, ref: 'Template', required: true },
  postPaymentTemplate: { type: Schema.Types.ObjectId, ref: 'Template', required: true },
  overdueTemplate: { type: Schema.Types.ObjectId, ref: 'Template', required: true },
  lastSentAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IClient>('Client', ClientSchema);
