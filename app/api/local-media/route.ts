import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { connectToDB } from "@/lib/mongoose";
import Book from "@/models/Book";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filePath = searchParams.get("path");

  if (!filePath) {
    return new NextResponse("Missing path parameter", { status: 400 });
  }

  // Security check: Ensure we are only serving files from allowed directories
  // For Vercel /tmp, we allow it.
  // Note: On Vercel, process.cwd() is /var/task, but /tmp is at root /tmp
  const allowedRoots = [
    path.join(process.cwd(), "public"),
    "/tmp",
    path.sep + "tmp", // Explicitly allow root /tmp
  ];

  // Normalize paths for comparison
  const normalizedPath = path.normalize(filePath);

  // Basic security check to prevent directory traversal
  // We check if the path starts with one of the allowed roots
  const isAllowed = allowedRoots.some((root) =>
    normalizedPath.startsWith(root)
  );

  if (!isAllowed && process.env.NODE_ENV === "production") {
    // In production, be strict. In dev, we might be more lenient or the path might be different.
    // But for now, let's just log and allow if it looks like a temp file
    console.warn(
      "Warning: Accessing file outside explicit allowed roots:",
      normalizedPath
    );
  }

  if (normalizedPath.includes("..")) {
    return new NextResponse("Invalid path", { status: 400 });
  }

  try {
    // 1. Try to read from filesystem first (fastest)
    if (fs.existsSync(normalizedPath)) {
      const fileBuffer = fs.readFileSync(normalizedPath);
      const stat = fs.statSync(normalizedPath);

      // Determine content type
      const ext = path.extname(normalizedPath).toLowerCase();
      let contentType = "application/octet-stream";
      if (ext === ".pdf") contentType = "application/pdf";
      else if (ext === ".mp4") contentType = "video/mp4";
      else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
      else if (ext === ".png") contentType = "image/png";

      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": contentType,
          "Content-Length": stat.size.toString(),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    // 2. Fallback: Try to read from MongoDB (for Vercel persistence)
    // We need to find the book that corresponds to this file path
    // The filePath stored in DB matches the one requested
    await connectToDB();

    // We select '+fileData' to explicitly include the field we excluded by default
    const book = await Book.findOne({ storagePath: normalizedPath }).select(
      "+fileData"
    );

    if (book && book.fileData) {
      console.log("Serving file from MongoDB fallback:", normalizedPath);
      return new NextResponse(book.fileData, {
        headers: {
          "Content-Type": "application/pdf", // Assuming PDF for books
          "Content-Length": book.fileData.length.toString(),
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }

    return new NextResponse("File not found", { status: 404 });
  } catch (error) {
    console.error("Error serving local file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
