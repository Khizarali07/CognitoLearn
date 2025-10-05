import mongoose, { Schema, model, models } from "mongoose";

export interface IBook extends mongoose.Document {
  title: string;
  ownerId: mongoose.Types.ObjectId;
  fileName: string;
  fileUrl: string; // Firebase Storage URL
  storagePath: string; // Firebase Storage path for deletion
  fileSize: number;
  totalPages: number;
  currentPage: number;
  lastReadPosition: {
    page: number;
    scrollTop: number;
    highlightedText?: string;
  };
  progress: number; // 0-100
  isCompleted: boolean;
  uploadedAt: Date;
  lastAccessedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BookSchema = new Schema<IBook>(
  {
    title: {
      type: String,
      required: [true, "Book title is required"],
      trim: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner ID is required"],
      index: true,
    },
    fileName: {
      type: String,
      required: [true, "File name is required"],
    },
    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
    },
    storagePath: {
      type: String,
      required: [true, "Storage path is required"],
    },
    fileSize: {
      type: Number,
      required: true,
    },
    totalPages: {
      type: Number,
      default: 0,
    },
    currentPage: {
      type: Number,
      default: 1,
    },
    lastReadPosition: {
      page: {
        type: Number,
        default: 1,
      },
      scrollTop: {
        type: Number,
        default: 0,
      },
      highlightedText: {
        type: String,
        default: "",
      },
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
BookSchema.index({ ownerId: 1, createdAt: -1 });

// Prevent re-compilation in development
const Book = models.Book || model<IBook>("Book", BookSchema);

export default Book;
