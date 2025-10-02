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
 * Extract numeric prefix from a video title for sorting.
 * Handles formats like: "001 Title", "01 Title", "1 Title", "1. Title", etc.
 */
function extractNumericPrefix(title: string): number {
  // Match numeric prefix patterns: "001", "01", "1", "1.", "1-", etc.
  const match = title.match(/^(\d+)[\s\.\-_]*/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return Infinity; // Put items without numeric prefix at the end
}

/**
 * Natural sort function for video titles with numeric prefixes.
 * Sorts by numeric prefix first, then alphabetically.
 */
function naturalSort(a: ExtractedVideo, b: ExtractedVideo): number {
  const aNum = extractNumericPrefix(a.title);
  const bNum = extractNumericPrefix(b.title);

  // If both have numeric prefixes, sort by number
  if (aNum !== Infinity && bNum !== Infinity) {
    return aNum - bNum;
  }

  // If only one has a numeric prefix, it comes first
  if (aNum !== Infinity) return -1;
  if (bNum !== Infinity) return 1;

  // If neither has a numeric prefix, sort alphabetically
  return a.title.localeCompare(b.title, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

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
    // Use the positional constructor overload to avoid casting to `any`.
    const jwtClient = new google.auth.JWT(clientEmail, undefined, privateKey, [
      "https://www.googleapis.com/auth/drive.readonly",
    ]);

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
    const params: Record<string, unknown> = {
      q,
      fields: "files(id,name,mimeType,webViewLink,webContentLink)",
      pageSize: 1000,
    };

    if (!process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_API_KEY) {
      params.key = process.env.GOOGLE_API_KEY;
    }

    // Call the files.list and narrow the response shape without using `any`.
    const res = (await drive.files.list(
      params as unknown as Record<string, unknown>
    )) as unknown;

    const resTyped = (res as {
      data?: {
        files?: Array<{ id?: string; name?: string; mimeType?: string }>;
      };
    }) || { data: { files: [] } };
    const filesTyped = (resTyped.data?.files ?? []) as Array<{
      id?: string;
      name?: string;
      mimeType?: string;
    }>;

    const extracted: ExtractedVideo[] = filesTyped.map((f) => ({
      id: f.id ?? "",
      title: f.name ?? `Video ${f.id ?? ""}`,
      embedUrl: `https://drive.google.com/file/d/${f.id}/preview`,
      mimeType: f.mimeType,
    }));

    // Sort videos by numeric prefix (001, 01, 1, etc.) for proper ordering
    extracted.sort(naturalSort);

    // If a courseId was provided, persist the videos to MongoDB
    if (courseId) {
      await dbConnect();

      const course = await Course.findById(courseId);
      if (!course) throw new Error("Course not found");

      // Prepare Video docs
      const createdVideos: unknown[] = [];
      for (let i = 0; i < extracted.length; i++) {
        const v = extracted[i];
        const videoDoc = await Video.create({
          courseId: course._id,
          title: v.title,
          videoUrl: v.embedUrl,
          order: (course.totalVideos || 0) + i,
          isCompleted: false,
        });
        createdVideos.push(videoDoc as unknown);
      }

      // Update course with new videos
      const newTotal = (course.totalVideos || 0) + createdVideos.length;
      // Narrow created documents to objects with _id so TypeScript can access the property.
      const createdIds = createdVideos.map((c) => (c as { _id?: unknown })._id);

      await Course.findByIdAndUpdate(course._id, {
        $push: { videos: { $each: createdIds } },
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
