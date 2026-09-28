import mongoose, { Document, Schema } from 'mongoose';

export interface ISchedule {
  _id?: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId;
  triggerType: 'DAILY_BEFORE_DUE' | 'DAILY_OVERDUE' | 'SPECIFIC_DATE' | 'ON_PAID';
  specificDate?: Date;
  sendTime: string;
  isActive: boolean;
  lastSentAt?: Date;
}

export interface IClient extends Document {
  name: string;
  uniqueId: string;
  email: string;
  baseAmount: number;
  uniqueAmount: number;
  startDate: Date;
  dueDate: Date;
  endDate: Date;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  isRecurring: boolean;
  schedules: ISchedule[];
  createdAt: Date;
}

const ScheduleSchema = new Schema({
  templateId: { type: Schema.Types.ObjectId, ref: 'Template', required: true },
  triggerType: { type: String, enum: ['DAILY_BEFORE_DUE', 'DAILY_OVERDUE', 'SPECIFIC_DATE', 'ON_PAID'], required: true },
  specificDate: { type: Date },
  sendTime: { type: String, default: '09:00' },
  isActive: { type: Boolean, default: true },
  lastSentAt: { type: Date }
});

const ClientSchema: Schema = new Schema({
  name: { type: String, required: true },
  uniqueId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  baseAmount: { type: Number, required: true },
  uniqueAmount: { type: Number, required: true },
  startDate: { type: Date, required: true },
  dueDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['PENDING', 'PAID', 'OVERDUE'], default: 'PENDING' },
  isRecurring: { type: Boolean, default: false },
  schedules: [ScheduleSchema],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IClient>('Client', ClientSchema);
