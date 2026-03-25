import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { unauthorized, internalError } from "@/lib/errors";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    return NextResponse.json({
      data: {
        userId: session.userId,
        username: session.username,
      },
    });
  } catch (err) {
    console.error("GET /api/v1/auth/me error:", err);
    return internalError();
  }
}
