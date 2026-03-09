import mongoose, { Document, Schema } from 'mongoose';

export interface IBook extends Document {
  clerkId: string;
  title: string;
  author: string;
  blobUrl: string;
  totalPages: number;
  totalSegments: number;
  createdAt: Date;
  updatedAt: Date;
}

const BookSchema = new Schema<IBook>(
  {
    clerkId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    blobUrl: { type: String, required: true },
    totalPages: { type: Number, default: 0 },
    totalSegments: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Book = mongoose.models.Book || mongoose.model<IBook>('Book', BookSchema);
export default Book;
