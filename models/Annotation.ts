import mongoose, { Schema, model, models } from "mongoose";

export interface IAnnotation extends mongoose.Document {
  bookId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  pageNumber: number;
  selectedText: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const AnnotationSchema = new Schema<IAnnotation>(
  {
    bookId: {
      type: Schema.Types.ObjectId,
      ref: "Book",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    pageNumber: {
      type: Number,
      required: true,
    },
    selectedText: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      default: "#FFEB3B", // Yellow highlight color
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
AnnotationSchema.index({ bookId: 1, pageNumber: 1 });

const Annotation =
  models.Annotation || model<IAnnotation>("Annotation", AnnotationSchema);

export default Annotation;
