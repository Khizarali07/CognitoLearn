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

export async function signUp(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    throw new Error("All fields are required");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  try {
    await dbConnect();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      redirect("/signup?message=User with this email already exists");
      return;
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    console.log("User created successfully:", user.email);
    redirect("/login?message=Account created successfully");
  } catch (error) {
    console.error("Sign up error:", error);

    if (
      error instanceof Error &&
      error.message.includes("MongoDB connection failed")
    ) {
      redirect(
        "/signup?message=Database connection error. Please contact administrator."
      );
      return;
    }

    throw error;
  }
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  try {
    await dbConnect();

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      redirect("/login?message=Invalid email or password");
      return;
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      redirect("/login?message=Invalid email or password");
      return;
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
      redirect(
        "/login?message=Database connection error. Please contact administrator."
      );
      return;
    }

    throw error;
  }
}

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email") as string;

  if (!email) {
    throw new Error("Email is required");
  }

  try {
    await dbConnect();

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      redirect(
        "/forgot-password?message=If an account with this email exists, you will receive a password reset link."
      );
      return;
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
    redirect(
      "/forgot-password?message=Password reset link sent to your email."
    );
  } catch (error) {
    console.error("Password reset error:", error);

    if (
      error instanceof Error &&
      error.message.includes("MongoDB connection failed")
    ) {
      redirect(
        "/forgot-password?message=Database connection error. Please try again later."
      );
      return;
    }

    throw error;
  }
}

export async function resetPassword(formData: FormData) {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!token || !password || !confirmPassword) {
    throw new Error("All fields are required");
  }

  if (password !== confirmPassword) {
    throw new Error("Passwords do not match");
  }

  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  try {
    await dbConnect();

    // Find valid reset token
    const resetRecord = await PasswordReset.findOne({
      token,
      expiresAt: { $gt: new Date() },
    });

    if (!resetRecord) {
      throw new Error("Invalid or expired reset token");
    }

    // Find user and update password
    const user = await User.findById(resetRecord.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);
    await User.findByIdAndUpdate(user._id, { password: hashedPassword });

    // Delete the reset token
    await PasswordReset.findByIdAndDelete(resetRecord._id);

    console.log("Password reset successfully for:", user.email);
    redirect(
      "/login?message=Password reset successfully. Please login with your new password."
    );
  } catch (error) {
    console.error("Reset password error:", error);
    throw error;
  }
}

export async function signOut() {
  try {
    // Clear the auth cookie
    const cookieStore = await cookies();
    cookieStore.delete("auth-token");

    console.log("User signed out");
    redirect("/login?message=You have been logged out successfully.");
  } catch (error) {
    console.error("Sign out error:", error);
    redirect("/login");
  }
}
