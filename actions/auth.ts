"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SignJWT } from "jose";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import PasswordReset from "@/models/PasswordReset";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { sendResetPasswordEmail } from "@/lib/email";
import { randomBytes } from "crypto";

type ActionResult = {
  success?: string;
  error?: string;
};

export async function signUp(formData: FormData): Promise<ActionResult> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { error: "All fields are required" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  try {
    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { error: "User with this email already exists" };
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    console.log("User created successfully:", user.email);
    return { success: "Account created successfully! Please sign in." };
  } catch (error) {
    console.error("Sign up error:", error);

    if (
      error instanceof Error &&
      error.message.includes("MongoDB connection failed")
    ) {
      return {
        error: "Database connection error. Please contact administrator.",
      };
    }

    return { error: "An error occurred. Please try again." };
  }
}

export async function signIn(
  formData: FormData
): Promise<ActionResult | never> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    await dbConnect();

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return { error: "Invalid email or password" };
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return { error: "Invalid email or password" };
    }

    // Create JWT token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const token = await new SignJWT({
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });

    console.log("User signed in successfully:", user.email);
    console.log("JWT Token set in cookie");

    // Redirect to dashboard after successful sign-in
    redirect("/dashboard");
  } catch (error) {
    // Don't log NEXT_REDIRECT as an error - it's normal behavior
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error; // Re-throw redirect errors
    }

    console.error("Sign in error:", error);

    if (
      error instanceof Error &&
      error.message.includes("MongoDB connection failed")
    ) {
      return {
        error: "Database connection error. Please contact administrator.",
      };
    }

    return { error: "An error occurred. Please try again." };
  }
}

export async function requestPasswordReset(
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required" };
  }

  try {
    await dbConnect();

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return {
        success:
          "If an account with this email exists, you will receive a password reset link.",
      };
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString("hex");

    // Remove any existing reset tokens for this user
    await PasswordReset.deleteMany({ userId: user._id });

    // Create new reset token
    await PasswordReset.create({
      userId: user._id,
      token: resetToken,
    });

    // Send reset email
    await sendResetPasswordEmail(email, resetToken);

    console.log("Password reset email sent to:", email);
    return { success: "Password reset link sent to your email." };
  } catch (error) {
    console.error("Password reset error:", error);

    if (
      error instanceof Error &&
      error.message.includes("MongoDB connection failed")
    ) {
      return { error: "Database connection error. Please try again later." };
    }

    return { error: "An error occurred. Please try again." };
  }
}

export async function resetPassword(formData: FormData): Promise<ActionResult> {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token || !password || !confirmPassword) {
    return { error: "All fields are required" };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  try {
    await dbConnect();

    // Find valid reset token
    const resetRecord = await PasswordReset.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!resetRecord) {
      return { error: "Invalid or expired reset token" };
    }

    // Find user and update password
    const user = await User.findById(resetRecord.userId);
    if (!user) {
      return { error: "User not found" };
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);
    await User.findByIdAndUpdate(user._id, { password: hashedPassword });

    // Delete the reset token
    await PasswordReset.findByIdAndDelete(resetRecord._id);

    console.log("Password reset successfully for:", user.email);
    return {
      success:
        "Password reset successfully! Please sign in with your new password.",
    };
  } catch (error) {
    console.error("Reset password error:", error);
    return { error: "An error occurred. Please try again." };
  }
}

export async function signOut() {
  try {
    // Clear the auth cookie
    const cookieStore = await cookies();
    cookieStore.delete("auth-token");

    console.log("User signed out");
    redirect("/login");
  } catch (error) {
    console.error("Sign out error:", error);
    redirect("/login");
  }
}
