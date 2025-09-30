import mongoose, { Schema, model, models } from "mongoose";

export interface IPasswordReset extends mongoose.Document {
  userId: mongoose.Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

const PasswordResetSchema = new Schema<IPasswordReset>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    token: {
      type: String,
      required: [true, "Reset token is required"],
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: [true, "Expiration date is required"],
      default: () => new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    },
  },
  {
    timestamps: true,
  }
);

// Create index for automatic cleanup of expired tokens
PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Prevent re-compilation in development
const PasswordReset =
  models.PasswordReset ||
  model<IPasswordReset>("PasswordReset", PasswordResetSchema);

export default PasswordReset;
