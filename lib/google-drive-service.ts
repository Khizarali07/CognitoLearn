// Placeholder service for Google Drive integration
// In a real implementation, this would use the Google Drive API

interface DriveVideo {
  title: string;
  embedUrl: string;
}

export async function extractVideosFromDriveLink(
  driveLink: string
): Promise<DriveVideo[]> {
  // This is a placeholder. In a production implementation you would use
  // the Google Drive API with proper OAuth credentials to list files in the
  // folder and generate embed URLs. For now we try to be a little smarter and
  // accept a variety of file/folder URL formats by normalizing file links.

  console.log("Processing Google Drive link:", driveLink);

  // Try to extract a Drive ID (file or folder). If the link points to a
  // single file we convert to a preview URL. If it's a folder we return
  // placeholder/demo items for now (real Drive API integration needed).
  const idInfo = extractDriveId(driveLink);
  console.log("Extracted Drive id:", idInfo);

  if (idInfo && idInfo.type === "file") {
    return [
      {
        title: `Drive video ${idInfo.id}`,
        embedUrl: makeDrivePreviewUrl(idInfo.id),
      },
    ];
  }

  // Fallback demo data for folder links (replace with real Drive API calls)
  return [
    {
      title: "Introduction to the Course",
      embedUrl: "https://drive.google.com/file/d/mock-video-1/preview",
    },
    {
      title: "Getting Started",
      embedUrl: "https://drive.google.com/file/d/mock-video-2/preview",
    },
    {
      title: "Advanced Topics",
      embedUrl: "https://drive.google.com/file/d/mock-video-3/preview",
    },
  ];
}

export function validateDriveLink(link: string): boolean {
  // Accept different common Drive link formats (folder or file links)
  const driveFolderPattern =
    /https:\/\/drive\.google\.com\/(drive\/folders|drive\/u\/[0-9]+\/folders)\/[a-zA-Z0-9_-]+/;
  const driveFilePattern =
    /https:\/\/drive\.google\.com\/(file\/d\/|open\?id=)[a-zA-Z0-9_-]+/;

  return driveFolderPattern.test(link) || driveFilePattern.test(link);
}

// Attempt to extract a file ID from a variety of Google Drive file URL formats.
// Attempt to extract a Drive ID and its type (file | folder) from common URL formats.
export function extractDriveId(
  url: string
): { id: string; type: "file" | "folder" } | null {
  if (!url) return null;

  // File URL: /file/d/FILE_ID/
  const fileIdMatch = url.match(/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch) return { id: fileIdMatch[1], type: "file" };

  // File URL variant: open?id=FILE_ID
  const openIdMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (openIdMatch) {
    // Could be file or folder; try to detect 'file' by looking for 'file' nearby
    const isFile =
      /file\/(d)\//.test(url) || /file=/.test(url) || /file\//.test(url);
    return { id: openIdMatch[1], type: isFile ? "file" : "folder" };
  }

  // Folder URL: /drive/folders/FOLDER_ID or /folders/FOLDER_ID
  const folderMatch = url.match(/(?:drive\/folders|folders)\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) return { id: folderMatch[1], type: "folder" };

  // drive/u/0/folders/FOLDER_ID
  const driveUFolderMatch = url.match(
    /drive\/u\/[0-9]+\/folders\/([a-zA-Z0-9_-]+)/
  );
  if (driveUFolderMatch) return { id: driveUFolderMatch[1], type: "folder" };

  return null;
}

export function makeDrivePreviewUrl(fileId: string) {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}
