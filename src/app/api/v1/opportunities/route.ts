import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parsePagination,
  prismaPaginationArgs,
  paginatedResponse,
} from "@/lib/pagination";
import { notDeleted } from "@/lib/soft-delete";
import { opportunitySearchFilter } from "@/lib/search";
import { requireSession } from "@/lib/auth";
import { unauthorized, badRequest, internalError } from "@/lib/errors";
import { isValidFunnelStage, isValidStatus } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    if (!session) return unauthorized();

    const { searchParams } = new URL(request.url);
    const params = parsePagination(searchParams, "createdAt");
    // Default order for opportunities is desc
    if (!searchParams.get("order")) {
      params.order = "desc";
    }

    const where: Record<string, unknown> = { ...notDeleted };
    if (params.q) Object.assign(where, opportunitySearchFilter(params.q));

    const funnelStage = searchParams.get("funnel_stage");
    if (funnelStage) where.funnelStage = funnelStage;

    const status = searchParams.get("status");
    if (status) where.status = status;

    const rep = searchParams.get("rep");
    if (rep) {
      where.rep = { contains: rep, mode: "insensitive" };
    }

    const [data, total] = await Promise.all([
      prisma.opportunity.findMany({
        where,
        ...prismaPaginationArgs(params),
        include: { company: { select: { id: true, name: true } } },
      }),
      prisma.opportunity.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(data, total, params));
  } catch (err) {
    console.error("GET /api/v1/opportunities error:", err);
    return internalError();
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (!session) return unauthorized();

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

    // Validate company exists
    const company = await prisma.company.findFirst({
      where: { id: companyId, ...notDeleted },
    });
    if (!company) {
      return badRequest("Validation failed.", [
        { field: "companyId", message: "Company not found or has been deleted.", rule: "exists" },
      ]);
    }

    const opportunity = await prisma.opportunity.create({
      data: {
        companyId,
        type: type || null,
        funnelStage,
        status,
        value: value != null ? Number(value) : null,
        rep: rep || null,
        notes: notes || null,
        createdBy: session.userId,
        updatedBy: session.userId,
      },
    });

    return NextResponse.json({ data: opportunity }, { status: 201 });
  } catch (err) {
    console.error("POST /api/v1/opportunities error:", err);
    return internalError();
  }
}
