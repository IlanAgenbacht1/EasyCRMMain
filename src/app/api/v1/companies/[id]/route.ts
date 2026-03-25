import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notDeleted, softDeleteData, softDeleteCompanyCascade } from "@/lib/soft-delete";
import { requireSession } from "@/lib/auth";
import {
  unauthorized,
  notFound,
  badRequest,
  dependencyExists,
  internalError,
} from "@/lib/errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    if (!session) return unauthorized();

    const { id } = await params;

    const company = await prisma.company.findFirst({
      where: { id, ...notDeleted },
    });

    if (!company) return notFound("Company not found.");

    const [contactsCount, opportunitiesCount] = await Promise.all([
      prisma.contact.count({ where: { companyId: id, ...notDeleted } }),
      prisma.opportunity.count({ where: { companyId: id, ...notDeleted } }),
    ]);

    return NextResponse.json({
      data: {
        ...company,
        _count: { contacts: contactsCount, opportunities: opportunitiesCount },
      },
    });
  } catch (err) {
    console.error("GET /api/v1/companies/[id] error:", err);
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
    const { name, website, industry, headcount, annualRevenue, city, region, country, notes } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return badRequest("Validation failed.", [
        { field: "name", message: "Company name is required.", rule: "required" },
      ]);
    }

    const existing = await prisma.company.findFirst({
      where: { id, ...notDeleted },
    });
    if (!existing) return notFound("Company not found.");

    const updated = await prisma.company.update({
      where: { id },
      data: {
        name: name.trim(),
        website: website || null,
        industry: industry || null,
        headcount: headcount != null ? Number(headcount) : null,
        annualRevenue: annualRevenue != null ? Number(annualRevenue) : null,
        city: city || null,
        region: region || null,
        country: country || null,
        notes: notes || null,
        updatedBy: session.userId,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error("PUT /api/v1/companies/[id] error:", err);
    return internalError();
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    if (!session) return unauthorized();

    const { id } = await params;

    const company = await prisma.company.findFirst({
      where: { id, ...notDeleted },
    });
    if (!company) return notFound("Company not found.");

    const [contactsCount, opportunitiesCount] = await Promise.all([
      prisma.contact.count({ where: { companyId: id, ...notDeleted } }),
      prisma.opportunity.count({ where: { companyId: id, ...notDeleted } }),
    ]);

    const hasDependents = contactsCount > 0 || opportunitiesCount > 0;

    if (hasDependents) {
      let cascade = false;
      try {
        const body = await request.json();
        cascade = body.cascade === true;
      } catch {
        // no body or invalid JSON — cascade not confirmed
      }

      if (!cascade) {
        return dependencyExists(
          `Company has ${contactsCount} contact(s) and ${opportunitiesCount} opportunity(ies). Send { "cascade": true } to confirm deletion.`
        );
      }

      const result = await softDeleteCompanyCascade(id, session.userId);
      return NextResponse.json({ data: result[2] });
    }

    const deleted = await prisma.company.update({
      where: { id },
      data: softDeleteData(session.userId),
    });

    return NextResponse.json({ data: deleted });
  } catch (err) {
    console.error("DELETE /api/v1/companies/[id] error:", err);
    return internalError();
  }
}
