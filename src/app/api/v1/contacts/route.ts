import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parsePagination,
  prismaPaginationArgs,
  paginatedResponse,
} from "@/lib/pagination";
import { notDeleted } from "@/lib/soft-delete";
import { contactSearchFilter } from "@/lib/search";
import { requireSession } from "@/lib/auth";
import { unauthorized, badRequest, internalError } from "@/lib/errors";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    if (!session) return unauthorized();

    const { searchParams } = new URL(request.url);
    const params = parsePagination(searchParams, "lastName");

    const where: Record<string, unknown> = { ...notDeleted };
    if (params.q) Object.assign(where, contactSearchFilter(params.q));

    const companyId = searchParams.get("company_id");
    if (companyId) where.companyId = companyId;

    const [data, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        ...prismaPaginationArgs(params),
        include: { company: { select: { id: true, name: true } } },
      }),
      prisma.contact.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(data, total, params));
  } catch (err) {
    console.error("GET /api/v1/contacts error:", err);
    return internalError();
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (!session) return unauthorized();

    const body = await request.json();
    const { firstName, lastName, companyId, title, email, phone, notes } = body;

    const errors = [];
    if (!firstName || typeof firstName !== "string" || !firstName.trim()) {
      errors.push({ field: "firstName", message: "First name is required.", rule: "required" });
    }
    if (!lastName || typeof lastName !== "string" || !lastName.trim()) {
      errors.push({ field: "lastName", message: "Last name is required.", rule: "required" });
    }
    if (!companyId || typeof companyId !== "string") {
      errors.push({ field: "companyId", message: "Company is required.", rule: "required" });
    }
    if (errors.length > 0) {
      return badRequest("Validation failed.", errors);
    }

    // Validate company exists and is active
    const company = await prisma.company.findFirst({
      where: { id: companyId, ...notDeleted },
    });
    if (!company) {
      return badRequest("Validation failed.", [
        { field: "companyId", message: "Company not found or has been deleted.", rule: "exists" },
      ]);
    }

    const contact = await prisma.contact.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        companyId,
        title: title || null,
        email: email || null,
        phone: phone || null,
        notes: notes || null,
        createdBy: session.userId,
        updatedBy: session.userId,
      },
    });

    return NextResponse.json({ data: contact }, { status: 201 });
  } catch (err) {
    console.error("POST /api/v1/contacts error:", err);
    return internalError();
  }
}
