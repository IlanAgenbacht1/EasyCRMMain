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
    const pag = parsePagination(searchParams, "lastName");

    const where: Record<string, unknown> = { companyId, ...notDeleted };
    if (pag.q) Object.assign(where, contactSearchFilter(pag.q));

    const [data, total] = await Promise.all([
      prisma.contact.findMany({ where, ...prismaPaginationArgs(pag) }),
      prisma.contact.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(data, total, pag));
  } catch (err) {
    console.error("GET /api/v1/companies/[id]/contacts error:", err);
    return internalError();
  }
}
