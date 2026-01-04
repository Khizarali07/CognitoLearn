"use server";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { connectToDB } from "@/lib/mongoose";
import Message from "@/models/Message";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mongoose from "mongoose";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

// Helper function to get current user ID from JWT
export async function getCurrentUserId(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    throw new Error("Unauthorized: No token found");
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);

    if (!payload || !payload.userId) {
      throw new Error("Unauthorized: Invalid token");
    }

    return payload.userId as string;
  } catch (error) {
    throw new Error("Unauthorized: Token verification failed");
  }
}

export async function getBookMessages(bookId: string) {
  try {
    await connectToDB();
    const userId = await getCurrentUserId();

    const messages = await Message.find({
      bookId,
      userId,
    }).sort({ createdAt: 1 }); // Oldest first

    return {
      success: true,
      messages: messages.map((msg) => ({
        id: msg._id.toString(),
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt.toISOString(),
        annotationId: msg.annotationId?.toString(),
      })),
    };
  } catch (error: any) {
    console.error("Get messages error:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch messages",
      messages: [],
    };
  }
}

export async function sendChatMessage(
  bookId: string,
  content: string,
  annotationId?: string
) {
  try {
    await connectToDB();
    const userId = await getCurrentUserId();

    // 1. Save User Message
    const userMsg = await Message.create({
      bookId,
      userId,
      role: "user",
      content,
      annotationId: annotationId || undefined,
    });

    // 2. Generate AI Response
    // Use gemini-1.5-flash as gemini-pro might be deprecated or unavailable in v1beta
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Fetch history for context
    const history = await Message.find({ bookId, userId })
      .sort({ createdAt: 1 })
      .limit(20); // Limit context window

    const chatHistory = history.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      history: chatHistory,
    });

    const result = await chat.sendMessage(content);
    const responseText = result.response.text();

    // 3. Save AI Message
    const aiMsg = await Message.create({
      bookId,
      userId,
      role: "ai",
      content: responseText,
    });

    return {
      success: true,
      userMessage: {
        id: userMsg._id.toString(),
        role: userMsg.role,
        content: userMsg.content,
        createdAt: userMsg.createdAt.toISOString(),
      },
      aiMessage: {
        id: aiMsg._id.toString(),
        role: aiMsg.role,
        content: aiMsg.content,
        createdAt: aiMsg.createdAt.toISOString(),
      },
    };
  } catch (error: any) {
    console.error("Send message error:", error);
    return {
      success: false,
      error: error.message || "Failed to send message",
    };
  }
}
