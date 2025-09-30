import fs from "fs";
import path from "path";

// Allowed roots can be configured in .env.local via LOCAL_MEDIA_ROOTS.
// Example: LOCAL_MEDIA_ROOTS=C:\Users\PC\Videos,C:\Media
const rawRoots = process.env.LOCAL_MEDIA_ROOTS || "";
const ALLOWED_ROOTS = rawRoots
  .split(",")
  .map((r) => r.trim())
  .filter(Boolean)
  .map((p) => path.resolve(p));

function isPathAllowed(resolvedPath: string) {
  // If explicit roots are provided, require the resolved path to be inside one.
  if (ALLOWED_ROOTS.length > 0) {
    return ALLOWED_ROOTS.some((root) => resolvedPath.startsWith(root));
  }

  // Development convenience: allow paths under the current working directory
  // so local devs can stream files without extra env configuration.
  // In production, encourage setting LOCAL_MEDIA_ROOTS for security.
  const cwd = path.resolve(process.cwd());
  return resolvedPath.startsWith(cwd);
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const p = url.searchParams.get("path");
    if (!p) {
      return new Response(JSON.stringify({ error: "Missing path" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const decoded = decodeURIComponent(p);
    const resolved = path.resolve(decoded);

    if (!isPathAllowed(resolved)) {
      return new Response(
        JSON.stringify({
          error:
            "Path not allowed or not configured. Configure LOCAL_MEDIA_ROOTS in .env.local with allowed folders.",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!fs.existsSync(resolved)) {
      return new Response(JSON.stringify({ error: "File not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const stat = fs.statSync(resolved);
    if (stat.isDirectory()) {
      return new Response(
        JSON.stringify({ error: "Path is a directory, expected a file" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Basic streaming response (no range support yet)
    const stream = fs.createReadStream(resolved);

    const ext = path.extname(resolved).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".mp4" || ext === ".m4v") contentType = "video/mp4";
    else if (ext === ".webm") contentType = "video/webm";
    else if (ext === ".ogg" || ext === ".ogv") contentType = "video/ogg";

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Content-Length": String(stat.size),
      "Accept-Ranges": "bytes",
    };

    return new Response(stream as any, { status: 200, headers });
  } catch (error) {
    console.error("Local media streaming error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
