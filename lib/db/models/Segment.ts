import mongoose, { Document, Schema } from 'mongoose';

export interface ISegment extends Document {
  bookId: mongoose.Types.ObjectId;
  clerkId: string;
  content: string;
  chunkIndex: number;
  pageNumber?: number;
  // Semantic embedding vector (1536-dim, OpenAI text-embedding-3-small).
  // Present for books uploaded after the embeddings upgrade;
  // absent for older books (those fall back to keyword/regex search).
  embedding?: number[];
  createdAt: Date;
}

const SegmentSchema = new Schema<ISegment>(
  {
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    clerkId: { type: String, required: true, index: true },
    content: { type: String, required: true },
    chunkIndex: { type: Number, required: true },
    pageNumber: { type: Number },
    // Excluded from queries by default (use +embedding to select it explicitly)
    embedding: { type: [Number], select: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Text index for keyword search (fallback for books without embeddings)
SegmentSchema.index({ content: 'text' });

const Segment =
  mongoose.models.Segment || mongoose.model<ISegment>('Segment', SegmentSchema);
export default Segment;
