import { google } from "googleapis";
import { Readable } from "stream";

// Initialize Google Drive API
function getGoogleDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });

  return google.drive({ version: "v3", auth });
}

/**
 * Upload a file to Google Drive
 * @param fileBuffer - The file buffer to upload
 * @param fileName - Name of the file
 * @param mimeType - MIME type of the file
 * @returns Google Drive file ID
 */
export async function uploadToGoogleDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string = "application/pdf"
): Promise<string> {
  console.log("=== GOOGLE DRIVE UPLOAD START ===");
  console.log("📁 File name:", fileName);
  console.log("📊 File size:", fileBuffer.length, "bytes");
  console.log(
    "🔑 Client Email:",
    process.env.GOOGLE_CLIENT_EMAIL ? "✅ Set" : "❌ Missing"
  );
  console.log(
    "🔑 Private Key:",
    process.env.GOOGLE_PRIVATE_KEY ? "✅ Set" : "❌ Missing"
  );
  console.log(
    "📂 Folder ID:",
    process.env.GOOGLE_DRIVE_FOLDER_ID || "❌ Missing"
  );

  try {
    const drive = getGoogleDriveClient();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!folderId) {
      console.error("❌ GOOGLE_DRIVE_FOLDER_ID not configured");
      throw new Error("GOOGLE_DRIVE_FOLDER_ID not configured");
    }

    console.log("🚀 Starting upload to Google Drive...");

    // Convert buffer to readable stream
    const stream = Readable.from(fileBuffer);

    // Upload file
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId],
        mimeType: mimeType,
      },
      media: {
        mimeType: mimeType,
        body: stream,
      },
      fields: "id, webViewLink, webContentLink",
    });

    if (!response.data.id) {
      console.error("❌ No file ID returned from Google Drive");
      throw new Error("Failed to upload file to Google Drive");
    }

    console.log("✅ File uploaded! Drive ID:", response.data.id);

    // Make file publicly accessible (anyone with link can view)
    console.log("🔓 Setting file permissions...");
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    console.log("✅ GOOGLE DRIVE UPLOAD SUCCESS! ID:", response.data.id);
    return response.data.id;
  } catch (error) {
    console.error("❌ GOOGLE DRIVE UPLOAD ERROR:");
    console.error(
      "Error type:",
      error instanceof Error ? error.constructor.name : typeof error
    );
    console.error(
      "Error message:",
      error instanceof Error ? error.message : error
    );
    if (error && typeof error === "object" && "response" in error) {
      const apiError = error as { response?: { data?: unknown } };
      console.error("API Response:", apiError.response?.data);
    }
    throw error;
  }
}

/**
 * Delete a file from Google Drive
 * @param fileId - Google Drive file ID
 */
export async function deleteFromGoogleDrive(fileId: string): Promise<void> {
  try {
    const drive = getGoogleDriveClient();
    await drive.files.delete({ fileId });
    console.log("✅ File deleted from Google Drive:", fileId);
  } catch (error) {
    console.error("❌ Error deleting from Google Drive:", error);
    throw error;
  }
}

/**
 * Get direct download link for a file
 * @param fileId - Google Drive file ID
 * @returns Direct download URL
 */
export function getGoogleDriveDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Get file metadata from Google Drive
 * @param fileId - Google Drive file ID
 * @returns File metadata
 */
export async function getGoogleDriveFileMetadata(fileId: string) {
  try {
    const drive = getGoogleDriveClient();
    const response = await drive.files.get({
      fileId,
      fields: "id, name, mimeType, size, webViewLink, webContentLink",
    });
    return response.data;
  } catch (error) {
    console.error("❌ Error getting file metadata:", error);
    throw error;
  }
}

/**
 * Stream a file from Google Drive
 * @param fileId - Google Drive file ID
 * @returns Readable stream
 */
export async function streamFromGoogleDrive(fileId: string) {
  try {
    const drive = getGoogleDriveClient();
    const response = await drive.files.get(
      { fileId, alt: "media" },
      { responseType: "stream" }
    );
    return response.data;
  } catch (error) {
    console.error("❌ Error streaming from Google Drive:", error);
    throw error;
  }
}

/**
 * Check if Google Drive is configured for book storage
 */
export function isGoogleDriveConfigured(): boolean {
  const hasEmail = !!process.env.GOOGLE_CLIENT_EMAIL;
  const hasKey = !!process.env.GOOGLE_PRIVATE_KEY;
  const hasFolder = !!process.env.GOOGLE_DRIVE_FOLDER_ID;

  console.log("=== CHECKING GOOGLE DRIVE CONFIG ===");
  console.log("📧 GOOGLE_CLIENT_EMAIL:", hasEmail ? "✅ Set" : "❌ Missing");
  console.log("🔑 GOOGLE_PRIVATE_KEY:", hasKey ? "✅ Set" : "❌ Missing");
  console.log(
    "📂 GOOGLE_DRIVE_FOLDER_ID:",
    hasFolder ? "✅ Set" : "❌ Missing"
  );

  const isConfigured = hasEmail && hasKey && hasFolder;
  console.log("🎯 Google Drive Configured:", isConfigured ? "✅ YES" : "❌ NO");

  return isConfigured;
}
