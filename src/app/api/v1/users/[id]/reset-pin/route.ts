import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { notDeleted } from "@/lib/soft-delete";
import { requireSession } from "@/lib/auth";
import { unauthorized, notFound, badRequest, internalError } from "@/lib/errors";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    if (!session) return unauthorized();

    const { id } = await params;
    const body = await request.json();
    const { pin } = body;

    if (!pin || typeof pin !== "string" || !/^\d{6,}$/.test(pin)) {
      return badRequest("Validation failed.", [
        {
          field: "pin",
          message: "PIN must be at least 6 digits (numeric only).",
          rule: "format",
        },
      ]);
    }

    const user = await prisma.user.findFirst({ where: { id, ...notDeleted } });
    if (!user) return notFound("User not found.");

    const pinHash = await bcrypt.hash(pin, 12);

    await prisma.user.update({
      where: { id },
      data: {
        pinHash,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });

    return NextResponse.json({ message: "PIN reset successfully." });
  } catch (err) {
    console.error("POST /api/v1/users/[id]/reset-pin error:", err);
    return internalError();
  }
}
