"use server";

import { google } from "googleapis";
import dbConnect from "@/lib/mongoose";
import Course from "@/models/Course";
import Video from "@/models/Video";

type ExtractedVideo = {
  id: string;
  title: string;
  embedUrl: string;
  mimeType?: string;
};

/**
 * Parse a Drive folder URL or plain ID and return the folder ID if present.
 */
function parseFolderId(linkOrId: string): string | null {
  if (!linkOrId) return null;

  // If it's already a plain-looking id
  if (/^[a-zA-Z0-9_-]+$/.test(linkOrId)) return linkOrId;

  // drive/folders/ID
  const folderMatch = linkOrId.match(
    /drive(?:\/u\/[0-9]+)?\/folders\/([a-zA-Z0-9_-]+)/
  );
  if (folderMatch) return folderMatch[1];

  // open?id=ID or ?id=ID
  const idMatch = linkOrId.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];

  return null;
}

/**
 * Create an authenticated google drive client.
 * Tries service account (GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY) first,
 * falls back to using an API key if available (read-only/public).
 */
async function createDriveClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;
  const apiKey = process.env.GOOGLE_API_KEY;

  if (clientEmail && rawPrivateKey) {
    const privateKey = rawPrivateKey.replace(/\\n/g, "\n");
    const jwtClient = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    } as any);

    await jwtClient.authorize();
    return google.drive({ version: "v3", auth: jwtClient });
  }

  if (apiKey) {
    // When using an API key we will attach it to requests; the google client
    // can be initialized without auth and we pass `key` in the params.
    return google.drive({ version: "v3" });
  }

  throw new Error(
    "No Google Drive credentials configured (service account or API key)."
  );
}

/**
 * Extract videos from a public Google Drive folder and optionally persist them.
 * - folderLink: the Drive folder URL or ID
 * - courseId: optional course id to attach videos to
 * Returns the extracted video metadata and (if courseId supplied) the saved Video docs.
 */
export async function extractGoogleDriveVideos(
  folderLink: string,
  courseId?: string
) {
  if (!folderLink) throw new Error("Folder link is required");

  const folderId = parseFolderId(folderLink);
  if (!folderId) throw new Error("Could not parse folder ID from link");

  // Create Drive client
  const drive = await createDriveClient();

  // Query for video files inside folder
  const q = `'${folderId}' in parents and mimeType contains 'video' and trashed = false`;

  try {
    // When service account auth was used, auth is part of the client.
    // If we're using an API key, include `key` in the params.
    const params: any = {
      q,
      fields: "files(id,name,mimeType,webViewLink,webContentLink)",
      pageSize: 1000,
    };

    if (!process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_API_KEY) {
      params.key = process.env.GOOGLE_API_KEY;
    }

    const res = await drive.files.list(params);
    const files = res.data.files || [];

    const extracted: ExtractedVideo[] = files.map((f: any) => ({
      id: f.id,
      title: f.name || `Video ${f.id}`,
      embedUrl: `https://drive.google.com/file/d/${f.id}/preview`,
      mimeType: f.mimeType,
    }));

    // If a courseId was provided, persist the videos to MongoDB
    if (courseId) {
      await dbConnect();

      const course = await Course.findById(courseId);
      if (!course) throw new Error("Course not found");

      // Prepare Video docs
      const createdVideos: any[] = [];
      for (let i = 0; i < extracted.length; i++) {
        const v = extracted[i];
        const videoDoc = await Video.create({
          courseId: course._id,
          title: v.title,
          videoUrl: v.embedUrl,
          order: (course.totalVideos || 0) + i,
          isCompleted: false,
        });
        createdVideos.push(videoDoc);
      }

      // Update course with new videos
      const newTotal = (course.totalVideos || 0) + createdVideos.length;
      await Course.findByIdAndUpdate(course._id, {
        $push: { videos: { $each: createdVideos.map((c) => c._id) } },
        totalVideos: newTotal,
      });

      return { folderId, extracted, saved: createdVideos };
    }

    return { folderId, extracted, saved: null };
  } catch (error) {
    console.error("extractGoogleDriveVideos error:", error);
    throw error;
  }
}
