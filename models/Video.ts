import mongoose, { Schema, model, models } from "mongoose";

export interface IVideo extends mongoose.Document {
  courseId: mongoose.Types.ObjectId;
  title: string;
  videoUrl: string;
  isCompleted: boolean;
  duration?: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const VideoSchema = new Schema<IVideo>(
  {
    courseId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course ID is required"],
    },
    title: {
      type: String,
      required: [true, "Video title is required"],
      trim: true,
    },
    videoUrl: {
      type: String,
      required: [true, "Video URL is required"],
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    duration: {
      type: Number,
      min: 0,
    },
    order: {
      type: Number,
      required: [true, "Video order is required"],
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for courseId and order
VideoSchema.index({ courseId: 1, order: 1 }, { unique: true });

// Prevent re-compilation in development
const Video = models.Video || model<IVideo>("Video", VideoSchema);

export default Video;
