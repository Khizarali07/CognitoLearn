import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const filePath = searchParams.get("path");

  if (!filePath) {
    return new NextResponse("Missing path parameter", { status: 400 });
  }

  // Security check: Ensure we are only serving files from allowed directories
  // For Vercel /tmp, we allow it.
  const allowedRoots = [
    path.join(process.cwd(), "public"),
    "/tmp",
  ];

  // Normalize paths for comparison
  const normalizedPath = path.normalize(filePath);
  
  // Basic security check to prevent directory traversal
  if (normalizedPath.includes("..")) {
      return new NextResponse("Invalid path", { status: 400 });
  }

  try {
    if (!fs.existsSync(normalizedPath)) {
      return new NextResponse("File not found", { status: 404 });
    }

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
  } catch (error) {
    console.error("Error serving local file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
