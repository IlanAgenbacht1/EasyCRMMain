import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { notDeleted } from "@/lib/soft-delete";
import { requireSession } from "@/lib/auth";
import { unauthorized, badRequest, internalError } from "@/lib/errors";

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (!session) return unauthorized();

    const body = await request.json();
    const { currentPin, newPin } = body;

    if (!currentPin || !newPin) {
      return badRequest("Current PIN and new PIN are required.");
    }

    if (typeof newPin !== "string" || !/^\d{6,}$/.test(newPin)) {
      return badRequest("Validation failed.", [
        {
          field: "newPin",
          message: "New PIN must be at least 6 digits (numeric only).",
          rule: "format",
        },
      ]);
    }

    const user = await prisma.user.findFirst({
      where: { id: session.userId, ...notDeleted },
    });
    if (!user) return unauthorized();

    const match = await bcrypt.compare(String(currentPin), user.pinHash);
    if (!match) {
      return badRequest("Validation failed.", [
        { field: "currentPin", message: "Current PIN is incorrect.", rule: "match" },
      ]);
    }

    const pinHash = await bcrypt.hash(newPin, 12);
    await prisma.user.update({
      where: { id: session.userId },
      data: { pinHash },
    });

    return NextResponse.json({ message: "PIN changed successfully." });
  } catch (err) {
    console.error("POST /api/v1/users/change-pin error:", err);
    return internalError();
  }
}
