import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  parsePagination,
  prismaPaginationArgs,
  paginatedResponse,
} from "@/lib/pagination";
import { notDeleted } from "@/lib/soft-delete";
import { requireSession } from "@/lib/auth";
import { unauthorized, badRequest, conflict, internalError } from "@/lib/errors";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    if (!session) return unauthorized();

    const { searchParams } = new URL(request.url);
    const params = parsePagination(searchParams, "username");

    const where = { ...notDeleted };

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where,
        ...prismaPaginationArgs(params),
        select: {
          id: true,
          username: true,
          displayName: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(data, total, params));
  } catch (err) {
    console.error("GET /api/v1/users error:", err);
    return internalError();
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (!session) return unauthorized();

    const body = await request.json();
    const { username, pin, displayName } = body;

    const errors = [];
    if (!username || typeof username !== "string" || !username.trim()) {
      errors.push({ field: "username", message: "Username is required.", rule: "required" });
    }
    if (!pin || typeof pin !== "string") {
      errors.push({ field: "pin", message: "PIN is required.", rule: "required" });
    } else if (!/^\d{6,}$/.test(pin)) {
      errors.push({
        field: "pin",
        message: "PIN must be at least 6 digits (numeric only).",
        rule: "format",
      });
    }
    if (errors.length > 0) {
      return badRequest("Validation failed.", errors);
    }

    // Check username uniqueness
    const existing = await prisma.user.findFirst({
      where: { username: username.trim() },
    });
    if (existing) {
      return conflict("Username already exists.", "CONFLICT");
    }

    const pinHash = await bcrypt.hash(pin, 12);

    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        pinHash,
        displayName: displayName || null,
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (err) {
    console.error("POST /api/v1/users error:", err);
    return internalError();
  }
}
