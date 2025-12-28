"use server";

import dbConnect from "@/lib/mongoose";
import Annotation from "@/models/Annotation";
import { getCurrentUserId } from "./bookActions"; // Reusing auth logic
import mongoose from "mongoose";

export async function createVideoAnnotation(
  videoId: string,
  text: string,
  timestamp: number
) {
  try {
    const userId = await getCurrentUserId();
    await dbConnect();

    const annotation = await Annotation.create({
      userId,
      videoId,
      selectedText: text, // treating note content as "selectedText" for now, or we can add a 'note' field? 
                          // The Schema has 'selectedText' which is required. 
                          // For video notes, 'selectedText' will be the user's note itself.
      timestamp,
      color: "#818cf8", // Indigo-400 equivalent for premium feel
    });

    return { success: true, annotation: JSON.parse(JSON.stringify(annotation)) };
  } catch (error: any) {
    console.error("Create video annotation error:", error);
    return { success: false, error: error.message };
  }
}

export async function getVideoAnnotations(videoId: string) {
  try {
    const userId = await getCurrentUserId();
    await dbConnect();

    const annotations = await Annotation.find({ videoId, userId })
      .sort({ timestamp: 1 }) // Sort by time
      .lean();

    return {
      success: true,
      annotations: JSON.parse(JSON.stringify(annotations)),
    };
  } catch (error: any) {
    console.error("Get video annotations error:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteVideoAnnotation(annotationId: string) {
  try {
    const userId = await getCurrentUserId();
    await dbConnect();

    const result = await Annotation.deleteOne({
      _id: annotationId,
      userId,
    });

    if (result.deletedCount === 0) {
      return { success: false, error: "Annotation not found or unauthorized" };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Delete video annotation error:", error);
    return { success: false, error: error.message };
  }
}
