import mongoose, { Document, Schema } from 'mongoose';

export interface IVoiceSession extends Document {
  bookId: mongoose.Types.ObjectId;
  clerkId: string;
  vapiCallId?: string;
  personaId: string;
  startedAt: Date;
  endedAt?: Date;
  durationSeconds?: number;
  billingMonth: string; // "YYYY-MM"
}

const VoiceSessionSchema = new Schema<IVoiceSession>(
  {
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true },
    clerkId: { type: String, required: true, index: true },
    vapiCallId: { type: String },
    personaId: { type: String, required: true },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date },
    durationSeconds: { type: Number },
    billingMonth: { type: String, required: true }, // "YYYY-MM"
  },
  { timestamps: false }
);

VoiceSessionSchema.index({ clerkId: 1, billingMonth: 1 });

const VoiceSession =
  mongoose.models.VoiceSession ||
  mongoose.model<IVoiceSession>('VoiceSession', VoiceSessionSchema);
export default VoiceSession;
