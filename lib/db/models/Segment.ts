import mongoose, { Document, Schema } from 'mongoose';

export interface ISegment extends Document {
  bookId: mongoose.Types.ObjectId;
  clerkId: string;
  content: string;
  chunkIndex: number;
  pageNumber?: number;
  createdAt: Date;
}

const SegmentSchema = new Schema<ISegment>(
  {
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    clerkId: { type: String, required: true, index: true },
    content: { type: String, required: true },
    chunkIndex: { type: Number, required: true },
    pageNumber: { type: Number },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Text index for keyword search (RAG fallback)
SegmentSchema.index({ content: 'text' });

const Segment =
  mongoose.models.Segment || mongoose.model<ISegment>('Segment', SegmentSchema);
export default Segment;
