import mongoose, { Schema, model, models } from "mongoose";

export interface ICourse extends mongoose.Document {
  title: string;
  ownerId: mongoose.Types.ObjectId;
  sourceType: "local" | "google-drive";
  sourcePathOrLink: string;
  totalVideos: number;
  completedVideos: number;
  videos: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    title: {
      type: String,
      required: [true, "Course title is required"],
      trim: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner ID is required"],
    },
    sourceType: {
      type: String,
      enum: ["local", "google-drive"],
      required: [true, "Source type is required"],
    },
    sourcePathOrLink: {
      type: String,
      required: [true, "Source path or link is required"],
    },
    totalVideos: {
      type: Number,
      default: 0,
    },
    completedVideos: {
      type: Number,
      default: 0,
    },
    videos: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation in development
const Course = models.Course || model<ICourse>("Course", CourseSchema);

export default Course;
