import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notDeleted, softDeleteData } from "@/lib/soft-delete";
import { requireSession } from "@/lib/auth";
import { unauthorized, notFound, badRequest, internalError } from "@/lib/errors";
import { isValidFunnelStage, isValidStatus } from "@/lib/constants";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    if (!session) return unauthorized();

    const { id } = await params;

    const opportunity = await prisma.opportunity.findFirst({
      where: { id, ...notDeleted },
      include: {
        company: {
          select: { id: true, name: true, website: true, city: true, country: true },
        },
      },
    });

    if (!opportunity) return notFound("Opportunity not found.");

    // Fetch company contacts (active only)
    const companyContacts = await prisma.contact.findMany({
      where: { companyId: opportunity.companyId, ...notDeleted },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        title: true,
        email: true,
        phone: true,
      },
      orderBy: { lastName: "asc" },
    });

    return NextResponse.json({
      data: {
        ...opportunity,
        companyContacts,
      },
    });
  } catch (err) {
    console.error("GET /api/v1/opportunities/[id] error:", err);
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
    const { companyId, type, funnelStage, status, value, rep, notes } = body;

    const errors = [];
    if (!companyId || typeof companyId !== "string") {
      errors.push({ field: "companyId", message: "Company is required.", rule: "required" });
    }
    if (!funnelStage || !isValidFunnelStage(funnelStage)) {
      errors.push({
        field: "funnelStage",
        message: "Valid funnel stage is required.",
        rule: "enum",
      });
    }
    if (!status || !isValidStatus(status)) {
      errors.push({ field: "status", message: "Valid status is required.", rule: "enum" });
    }
    if (errors.length > 0) {
      return badRequest("Validation failed.", errors);
    }

    const existing = await prisma.opportunity.findFirst({
      where: { id, ...notDeleted },
    });
    if (!existing) return notFound("Opportunity not found.");

    // Validate company exists
    const company = await prisma.company.findFirst({
      where: { id: companyId, ...notDeleted },
    });
    if (!company) {
      return badRequest("Validation failed.", [
        { field: "companyId", message: "Company not found or has been deleted.", rule: "exists" },
      ]);
    }

    const updated = await prisma.opportunity.update({
      where: { id },
      data: {
        companyId,
        type: type || null,
        funnelStage,
        status,
        value: value != null ? Number(value) : null,
        rep: rep || null,
        notes: notes || null,
        updatedBy: session.userId,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("PUT /api/v1/opportunities/[id] error:", err);
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

    const opportunity = await prisma.opportunity.findFirst({
      where: { id, ...notDeleted },
    });
    if (!opportunity) return notFound("Opportunity not found.");

    const deleted = await prisma.opportunity.update({
      where: { id },
      data: softDeleteData(session.userId),
    });

    return NextResponse.json({ data: deleted });
  } catch (err) {
    console.error("DELETE /api/v1/opportunities/[id] error:", err);
    return internalError();
  }
}
