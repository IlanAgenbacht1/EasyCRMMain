import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notDeleted } from "@/lib/soft-delete";
import { requireSession } from "@/lib/auth";
import { unauthorized, notFound, internalError } from "@/lib/errors";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    if (!session) return unauthorized();

    const { id } = await params;
    const body = await request.json();
    const { displayName, isActive } = body;

    const existing = await prisma.user.findFirst({
      where: { id, ...notDeleted },
    });
    if (!existing) return notFound("User not found.");

    const data: Record<string, unknown> = {};
    if (displayName !== undefined) data.displayName = displayName || null;
    if (isActive !== undefined) data.isActive = Boolean(isActive);
    data.updatedAt = new Date();

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        displayName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("PUT /api/v1/users/[id] error:", err);
    return internalError();
  }
}
