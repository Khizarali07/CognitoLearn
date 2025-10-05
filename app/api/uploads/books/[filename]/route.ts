import { NextRequest } from "next/server";
import { readFile, stat } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

// Force Node.js runtime (not Edge)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  console.log("=== PDF API ROUTE CALLED ===");
  console.log("Request URL:", request.url);
  console.log("Request method:", request.method);
  console.log(
    "Request headers:",
    Object.fromEntries(request.headers.entries())
  );

  try {
    // Await params in Next.js 15
    const params = await context.params;
    const filename = params.filename;

    console.log("📄 Filename:", filename);

    if (!filename) {
      console.error("❌ No filename provided");
      return new Response("No filename provided", { status: 400 });
    }

    const filePath = join(
      process.cwd(),
      "public",
      "uploads",
      "books",
      filename
    );

    console.log("📁 Looking for file at:", filePath);
    console.log("📂 Current working directory:", process.cwd());
    console.log("🔍 File exists?", existsSync(filePath));

    if (!existsSync(filePath)) {
      console.error("❌ File not found at:", filePath);
      return new Response("PDF not found", { status: 404 });
    }

    // Get file stats
    const fileStats = await stat(filePath);
    const fileSize = fileStats.size;
    console.log("📊 File size:", fileSize, "bytes");

    // Check for Range header (partial content request)
    const range = request.headers.get("range");
    console.log("📡 Range header:", range || "none");

    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;

      console.log(
        `📦 Serving partial content: bytes ${start}-${end}/${fileSize}`
      );

      // Read only the requested chunk
      const fileBuffer = await readFile(filePath);
      const chunk = fileBuffer.slice(start, end + 1);
      const uint8Array = new Uint8Array(chunk);

      return new Response(uint8Array, {
        status: 206, // Partial Content
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Content-Length": chunksize.toString(),
          "Content-Type": "application/pdf",
          "Content-Disposition": "inline",
          "Cache-Control": "no-cache",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Range",
        },
      });
    }

    // No range header - serve full file
    console.log("📄 Serving full file");
    const fileBuffer = await readFile(filePath);
    console.log("✅ File read successfully, size:", fileBuffer.length, "bytes");

    console.log("✅ Returning PDF with 200 status");

    // Use standard Response with Uint8Array
    return new Response(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": fileBuffer.length.toString(),
        "Content-Disposition": "inline", // Display in browser, not download
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("❌ ERROR in PDF API route:");
    console.error(
      "Error type:",
      error instanceof Error ? error.constructor.name : typeof error
    );
    console.error(
      "Error message:",
      error instanceof Error ? error.message : error
    );
    console.error("Full error:", error);
    return new Response("PDF not found", { status: 404 });
  }
}

export async function HEAD(
  request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  console.log("=== PDF HEAD REQUEST ===");

  try {
    const params = await context.params;
    const filename = params.filename;

    if (!filename) {
      return new Response(null, { status: 400 });
    }

    const filePath = join(
      process.cwd(),
      "public",
      "uploads",
      "books",
      filename
    );

    if (!existsSync(filePath)) {
      return new Response(null, { status: 404 });
    }

    const fileStats = await stat(filePath);

    console.log("✅ HEAD request successful, file size:", fileStats.size);

    return new Response(null, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": fileStats.size.toString(),
        "Content-Disposition": "inline",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  } catch (error) {
    console.error("❌ HEAD request error:", error);
    return new Response(null, { status: 404 });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Range, Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
