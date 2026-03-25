import { NextResponse } from "next/server";
import { clearSession } from "@/lib/auth";
import { internalError } from "@/lib/errors";

export async function POST() {
  try {
    await clearSession();
    return NextResponse.json({ message: "Logged out." });
  } catch (err) {
    console.error("POST /api/v1/auth/logout error:", err);
    return internalError();
  }
}
