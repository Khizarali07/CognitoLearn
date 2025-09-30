"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/mongoose";
import Course from "@/models/Course";
import Video from "@/models/Video";
import User from "@/models/User";
import {
  extractVideosFromDriveLink,
  validateDriveLink,
} from "@/lib/google-drive-service";
import path from "path";
import fs from "fs";

export async function createCourse(formData: FormData) {
  const title = formData.get("title") as string;
  const sourceType = formData.get("sourceType") as "local" | "google-drive";
  const sourcePathOrLink = formData.get("sourcePathOrLink") as string;

  // Mock user ID - in a real app, get this from session
  const mockUserId = "507f1f77bcf86cd799439011";

  if (!title || !sourceType || !sourcePathOrLink) {
    throw new Error("All fields are required");
  }

  try {
    await dbConnect();

    // Validate source based on type
    if (sourceType === "google-drive") {
      if (!validateDriveLink(sourcePathOrLink)) {
        throw new Error("Invalid Google Drive link format");
      }
    } else if (sourceType === "local") {
      // For local paths, we just validate that it's not empty
      // In a real app, you might want to check if the path exists
      if (!sourcePathOrLink.trim()) {
        throw new Error("Local path cannot be empty");
      }
    }

    // Create course
    const course = await Course.create({
      title,
      ownerId: mockUserId,
      sourceType,
      sourcePathOrLink,
    });

    // Process videos based on source type
    let videos = [];

    if (sourceType === "google-drive") {
      try {
        const driveVideos = await extractVideosFromDriveLink(sourcePathOrLink);

        for (let i = 0; i < driveVideos.length; i++) {
          const video = await Video.create({
            courseId: course._id,
            title: driveVideos[i].title,
            videoUrl: driveVideos[i].embedUrl,
            order: i,
          });
          videos.push(video._id);
        }
      } catch (error) {
        console.error("Error processing Google Drive videos:", error);
      }
    } else if (sourceType === "local") {
      // For local files, create placeholder videos
      // In a real app, you would scan the directory for video files
      const mockLocalVideos = [
        { title: "Video 1", filename: "video1.mp4" },
        { title: "Video 2", filename: "video2.mp4" },
        { title: "Video 3", filename: "video3.mp4" },
      ];

      for (let i = 0; i < mockLocalVideos.length; i++) {
        const video = await Video.create({
          courseId: course._id,
          title: mockLocalVideos[i].title,
          videoUrl: path.join(sourcePathOrLink, mockLocalVideos[i].filename),
          order: i,
        });
        videos.push(video._id);
      }
    }

    // Update course with video references and counts
    await Course.findByIdAndUpdate(course._id, {
      videos: videos,
      totalVideos: videos.length,
    });

    console.log("Course created successfully:", course.title);
    redirect("/dashboard");
  } catch (error) {
    console.error("Create course error:", error);
    throw error;
  }
}

export async function markVideoCompleted(videoId: string, courseId: string) {
  try {
    await dbConnect();

    // Update video completion status
    const video = await Video.findByIdAndUpdate(
      videoId,
      { isCompleted: true },
      { new: true }
    );

    if (!video) {
      throw new Error("Video not found");
    }

    // Update course completed count
    const completedCount = await Video.countDocuments({
      courseId,
      isCompleted: true,
    });

    await Course.findByIdAndUpdate(courseId, {
      completedVideos: completedCount,
    });

    revalidatePath(`/course/${courseId}`);
    return { success: true };
  } catch (error) {
    console.error("Mark video completed error:", error);
    throw error;
  }
}

export async function getUserCourses() {
  try {
    await dbConnect();

    // Mock user ID - in a real app, get this from session
    const mockUserId = "507f1f77bcf86cd799439011";

    const courses = await Course.find({ ownerId: mockUserId })
      .populate("videos")
      .sort({ createdAt: -1 });

    return courses.map((course) => ({
      _id: course._id.toString(),
      title: course.title,
      totalVideos: course.totalVideos,
      completedVideos: course.completedVideos,
      sourceType: course.sourceType,
      createdAt: course.createdAt,
    }));
  } catch (error) {
    console.error("Get user courses error:", error);
    return [];
  }
}

export async function getCourseWithVideos(courseId: string) {
  try {
    await dbConnect();

    const course = await Course.findById(courseId).populate({
      path: "videos",
      options: { sort: { order: 1 } },
    });

    if (!course) {
      throw new Error("Course not found");
    }

    return {
      _id: course._id.toString(),
      title: course.title,
      sourceType: course.sourceType,
      totalVideos: course.totalVideos,
      completedVideos: course.completedVideos,
      videos: course.videos.map((video: any) => ({
        _id: video._id.toString(),
        title: video.title,
        videoUrl: video.videoUrl,
        isCompleted: video.isCompleted,
        order: video.order,
      })),
    };
  } catch (error) {
    console.error("Get course with videos error:", error);
    throw error;
  }
}
