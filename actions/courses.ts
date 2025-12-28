"use server";

import { redirect } from "next/navigation";
import dbConnect from "@/lib/mongoose";
import Course from "@/models/Course";
import Video from "@/models/Video";
import User from "@/models/User";
import { validateDriveLink } from "@/lib/google-drive-service";
import { extractGoogleDriveVideos } from "@/app/actions/googleDrive";
import fs from "fs";
import path from "path";

// Mock user ID for demonstration (in a real app, get this from session)
const MOCK_USER_ID = "67890abcdef1234567890123";

export async function getUserCourses() {
  try {
    await dbConnect();

    // In production, get user ID from session
    const courses = await Course.find({ ownerId: MOCK_USER_ID })
      .sort({ createdAt: -1 })
      .lean();

    // Convert MongoDB ObjectIds to strings for serialization
    return courses.map((course: any) => ({
      _id: course._id.toString(),
      title: course.title,
      ownerId: course.ownerId.toString(),
      sourceType: course.sourceType,
      sourcePathOrLink: course.sourcePathOrLink,
      totalVideos: course.totalVideos,
      completedVideos: course.completedVideos,
      videos: course.videos.map((v: any) => v.toString()),
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    }));
  } catch (error) {
    console.error("Get user courses error:", error);
    return [];
  }
}

export async function getCourseWithVideos(courseId: string) {
  try {
    await dbConnect();

    const course = await Course.findById(courseId).lean();
    if (!course) {
      throw new Error("Course not found");
    }

    const videos = await Video.find({ courseId }).sort({ order: 1 }).lean();

    return {
      _id: (course as any)._id.toString(),
      title: (course as any).title,
      ownerId: (course as any).ownerId.toString(),
      sourceType: (course as any).sourceType,
      sourcePathOrLink: (course as any).sourcePathOrLink,
      totalVideos: (course as any).totalVideos,
      completedVideos: (course as any).completedVideos,
      videos: videos.map((video: any) => ({
        _id: video._id.toString(),
        courseId: video.courseId.toString(),
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

export async function createCourse(formData: FormData) {
  const title = formData.get("title") as string;
  const sourceType = formData.get("sourceType") as "local" | "google-drive";
  const sourcePathOrLink = formData.get("sourcePathOrLink") as string;

  if (!title || !sourceType || !sourcePathOrLink) {
    throw new Error("All fields are required");
  }

  try {
    await dbConnect();

    // Create the course
    const course = await Course.create({
      title,
      ownerId: MOCK_USER_ID,
      sourceType,
      sourcePathOrLink,
      totalVideos: 0,
      completedVideos: 0,
    });

    let videos = [];

    if (sourceType === "google-drive") {
      // Validate Google Drive link
      if (!validateDriveLink(sourcePathOrLink)) {
        throw new Error("Invalid Google Drive link format");
      }

      // Extract videos from Google Drive using our server helper
      const result = await extractGoogleDriveVideos(sourcePathOrLink);
      const driveVideos = result.extracted || [];

      videos = await Promise.all(
        driveVideos.map((video, index) =>
          Video.create({
            courseId: course._id,
            title: video.title,
            videoUrl: video.embedUrl,
            order: index,
            isCompleted: false,
          })
        )
      );
    } else {
      // Handle local folder
      try {
        // If user used the browser folder picker, it stores a mock string like
        // "[Selected Folder: NAME]" which is not accessible from the server.
        if (sourcePathOrLink.startsWith("[Selected Folder:")) {
          throw new Error(
            "Folder picker cannot be used for server-side local access. Please enter the absolute folder path or configure LOCAL_MEDIA_ROOTS in .env.local to allow access."
          );
        }

        // Resolve and validate against allowed roots
        const resolvedRoot = path.resolve(sourcePathOrLink);
        const rawRoots = process.env.LOCAL_MEDIA_ROOTS || "";
        const allowedRoots = rawRoots
          .split(",")
          .map((r) => r.trim())
          .filter(Boolean)
          .map((p) => path.resolve(p));

        const isAllowed =
          allowedRoots.length > 0
            ? allowedRoots.some((root) => resolvedRoot.startsWith(root))
            : true;

        if (!isAllowed) {
          throw new Error(
            "Local path is not within allowed roots. Configure LOCAL_MEDIA_ROOTS in .env.local or enter a path inside the allowed folders."
          );
        }

        // Check if path exists and get video files
        if (fs.existsSync(resolvedRoot)) {
          const files = fs.readdirSync(sourcePathOrLink);
          const videoFiles = files.filter((file) => {
            const ext = path.extname(file).toLowerCase();
            return [
              ".mp4",
              ".avi",
              ".mov",
              ".wmv",
              ".flv",
              ".webm",
              ".mkv",
            ].includes(ext);
          });

          videos = await Promise.all(
            videoFiles.map((file, index) =>
              Video.create({
                courseId: course._id,
                title: path.parse(file).name,
                videoUrl: path.join(resolvedRoot, file),
                order: index,
                isCompleted: false,
              })
            )
          );
        } else {
          // Path doesn't exist, but we'll still create the course with a warning
          console.warn(`Local path does not exist: ${resolvedRoot}`);
          // Create a placeholder video to show the path was saved
          videos = [
            await Video.create({
              courseId: course._id,
              title: "Local videos (path not accessible)",
              videoUrl: sourcePathOrLink,
              order: 0,
              isCompleted: false,
            }),
          ];
        }
      } catch (fsError) {
        console.warn("Error reading local directory:", fsError);
        // Create a placeholder video
        videos = [
          await Video.create({
            courseId: course._id,
            title: "Local videos (path not accessible)",
            videoUrl: sourcePathOrLink,
            order: 0,
            isCompleted: false,
          }),
        ];
      }
    }

    // Update course with video count and IDs
    await Course.findByIdAndUpdate(course._id, {
      totalVideos: videos.length,
      videos: videos.map((v) => v._id),
    });

    console.log(
      `Course created successfully: ${course.title} with ${videos.length} videos`
    );

    // Return the created course id to the caller instead of redirecting.
    // Redirects from server actions can bubble as NEXT_REDIRECT when
    // invoked from client code. Let the client perform navigation.
    return { courseId: course._id.toString(), videosCount: videos.length };
  } catch (error) {
    console.error("Create course error:", error);
    throw error;
  }
}

export async function markVideoCompleted(videoId: string, courseId: string) {
  try {
    await dbConnect();

    // Mark video as completed
    await Video.findByIdAndUpdate(videoId, {
      isCompleted: true,
    });

    // Update course completion count
    const completedCount = await Video.countDocuments({
      courseId,
      isCompleted: true,
    });

    await Course.findByIdAndUpdate(courseId, {
      completedVideos: completedCount,
    });

    console.log(`Video marked as completed: ${videoId}`);
  } catch (error) {
    console.error("Mark video completed error:", error);
    throw error;
  }
}

export async function deleteCourse(formData: FormData) {
  const courseId = formData.get("courseId") as string;

  if (!courseId) {
    throw new Error("Missing courseId");
  }

  try {
    await dbConnect();

    // Remove all videos belonging to the course
    await Video.deleteMany({ courseId });

    // Remove the course itself
    await Course.findByIdAndDelete(courseId);

    console.log(`Deleted course and videos: ${courseId}`);

    // Redirect back to dashboard after deletion
    redirect("/dashboard");
  } catch (error) {
    console.error("Delete course error:", error);
    throw error;
  }
}

export async function updateCourse(courseId: string, newTitle: string) {
  try {
    await dbConnect();
    
    // In a real app, verify ownership here
    
    await Course.findByIdAndUpdate(courseId, { title: newTitle });
    
    return { success: true };
  } catch (error) {
    console.error("Update course error:", error);
    return { success: false, error: "Failed to update course" };
  }
}
