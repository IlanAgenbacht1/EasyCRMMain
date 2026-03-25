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
import { unauthorized, internalError } from "@/lib/errors";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    if (!session) return unauthorized();

    const { id: companyId } = await params;
    const { searchParams } = new URL(request.url);
    const pag = parsePagination(searchParams, "createdAt");

    const where: Record<string, unknown> = { companyId, ...notDeleted };
    if (pag.q) Object.assign(where, opportunitySearchFilter(pag.q));

    const [data, total] = await Promise.all([
      prisma.opportunity.findMany({ where, ...prismaPaginationArgs(pag) }),
      prisma.opportunity.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(data, total, pag));
  } catch (err) {
    console.error("GET /api/v1/companies/[id]/opportunities error:", err);
    return internalError();
  }
}
