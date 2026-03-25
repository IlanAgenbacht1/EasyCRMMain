import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notDeleted, softDeleteData } from "@/lib/soft-delete";
import { requireSession } from "@/lib/auth";
import { unauthorized, notFound, badRequest, internalError } from "@/lib/errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    if (!session) return unauthorized();

    const { id } = await params;

    const contact = await prisma.contact.findFirst({
      where: { id, ...notDeleted },
      include: { company: { select: { id: true, name: true } } },
    });

    if (!contact) return notFound("Contact not found.");

    return NextResponse.json({ data: contact });
  } catch (err) {
    console.error("GET /api/v1/contacts/[id] error:", err);
    return internalError();
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    if (!session) return unauthorized();

    const { id } = await params;
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

    const existing = await prisma.contact.findFirst({
      where: { id, ...notDeleted },
    });
    if (!existing) return notFound("Contact not found.");

    // Validate company exists
    const company = await prisma.company.findFirst({
      where: { id: companyId, ...notDeleted },
    });
    if (!company) {
      return badRequest("Validation failed.", [
        { field: "companyId", message: "Company not found or has been deleted.", rule: "exists" },
      ]);
    }

    const updated = await prisma.contact.update({
      where: { id },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        companyId,
        title: title || null,
        email: email || null,
        phone: phone || null,
        notes: notes || null,
        updatedBy: session.userId,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("PUT /api/v1/contacts/[id] error:", err);
    return internalError();
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    if (!session) return unauthorized();

    const { id } = await params;

    const contact = await prisma.contact.findFirst({
      where: { id, ...notDeleted },
    });
    if (!contact) return notFound("Contact not found.");

    const deleted = await prisma.contact.update({
      where: { id },
      data: softDeleteData(session.userId),
    });

    return NextResponse.json({ data: deleted });
  } catch (err) {
    console.error("DELETE /api/v1/contacts/[id] error:", err);
    return internalError();
  }
}
