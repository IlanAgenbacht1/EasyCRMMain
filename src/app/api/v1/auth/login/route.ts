import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import {
  findActiveUser,
  isLockedOut,
  recordFailedAttempt,
  clearFailedAttempts,
  setSession,
} from "@/lib/auth";
import { unauthorized, rateLimited, badRequest, internalError } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, pin } = body;

    if (!username || !pin) {
      return badRequest("Username and PIN are required.");
    }

    const user = await findActiveUser(username);
    if (!user) {
      return unauthorized("Invalid credentials.");
    }

    if (isLockedOut(user.lockedUntil)) {
      return rateLimited("Account locked. Try again later.");
    }

    const pinMatch = await bcrypt.compare(String(pin), user.pinHash);
    if (!pinMatch) {
      await recordFailedAttempt(user.id, user.failedLoginCount);
      return unauthorized("Invalid credentials.");
    }

    await clearFailedAttempts(user.id);
    await setSession({ userId: user.id, username: user.username });

    return NextResponse.json({
      data: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      },
    });
  } catch (err) {
    console.error("POST /api/v1/auth/login error:", err);
    return internalError();
  }
}
