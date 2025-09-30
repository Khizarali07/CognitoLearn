import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authToken = cookieStore.get("auth-token");

    return NextResponse.json({
      status: "success",
      cookieExists: !!authToken,
      cookieValue: authToken?.value ? "Token exists" : "No token",
      allCookies: Object.fromEntries(
        Array.from(cookieStore).map(([name, cookie]) => [
          name,
          cookie.value ? "exists" : "empty",
        ])
      ),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
