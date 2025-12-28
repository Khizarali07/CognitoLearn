"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function explainText(text: string) {
  try {
    if (!process.env.GOOGLE_API_KEY) {
      return {
        success: false,
        error: "GOOGLE_API_KEY is not configured",
      };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Explain the following text clearly and concisely, providing context and definition where necessary. If it's a specific term, define it. If it's a concept, explain it simply.\n\nText: "${text}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const explanation = response.text();

    return {
      success: true,
      explanation,
    };
  } catch (error: any) {
    console.error("AI Explanation error:", error);
    return {
      success: false,
      error: error.message || "Failed to generate explanation",
    };
  }
}
