import mongoose, { Schema, model, models } from "mongoose";

export interface IMessage extends mongoose.Document {
  bookId?: mongoose.Types.ObjectId;
  videoId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: "user" | "ai";
  content: string;
  annotationId?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    bookId: {
      type: Schema.Types.ObjectId,
      ref: "Book",
      required: false,
      index: true,
    },
    videoId: {
      type: Schema.Types.ObjectId,
      ref: "Video",
      required: false,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["user", "ai"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    annotationId: {
      type: Schema.Types.ObjectId,
      ref: "Annotation",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const Message = models.Message || model<IMessage>("Message", MessageSchema);

export default Message;
