"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

export async function sendCourseChatMessage(
  messages: ChatMessage[],
  newMessage: string,
  courseContext: { courseTitle: string; videoTitle: string }
) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Construct a system prompt with course context
    const contextPrompt = `You are an AI assistant for the course "${courseContext.courseTitle}".
The user is currently watching the video "${courseContext.videoTitle}".
Answer their questions based on general knowledge, assuming they are asking about the topic of this video or course.
Keep answers concise and helpful.

Current conversation:
${messages.map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`).join("\n")}

User: ${newMessage}
AI:`;

    const result = await model.generateContent(contextPrompt);
    const response = await result.response;
    const text = response.text();

    return {
      success: true,
      message: text,
    };
  } catch (error: any) {
    console.error("Course Chat Error:", error);
    return {
      success: false,
      error: "Failed to generate response",
    };
  }
}
