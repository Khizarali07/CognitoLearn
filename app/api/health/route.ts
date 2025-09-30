import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";

export async function GET() {
  try {
    const connection = await dbConnect();

    return NextResponse.json({
      status: "success",
      message: "Database connected successfully",
      database: connection.name,
      readyState: connection.readyState, // 1 = connected
      host: connection.host,
    });
  } catch (error) {
    console.error("Health check failed:", error);

    return NextResponse.json(
      {
        status: "error",
        message:
          error instanceof Error ? error.message : "Database connection failed",
        error:
          process.env.NODE_ENV === "development"
            ? String(error)
            : "Connection error",
      },
      { status: 500 }
    );
  }
}
