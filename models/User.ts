import mongoose, { Schema, model, models } from "mongoose";

export interface IUser extends mongoose.Document {
  email: string;
  password: string;
  name: string;
  courses: mongoose.Types.ObjectId[];
  books: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    courses: [
      {
        type: Schema.Types.ObjectId,
        ref: "Course",
      },
    ],
    books: [
      {
        type: Schema.Types.ObjectId,
        ref: "Book",
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation in development
const User = models.User || model<IUser>("User", UserSchema);

export default User;
