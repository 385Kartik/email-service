import mongoose, { Document, Schema } from 'mongoose';

export interface ITemplate extends Document {
  title: string;
  subject: string;
  message: string;
}

const TemplateSchema: Schema = new Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<ITemplate>('Template', TemplateSchema);
