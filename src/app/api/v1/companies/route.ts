import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  parsePagination,
  prismaPaginationArgs,
  paginatedResponse,
} from "@/lib/pagination";
import { notDeleted } from "@/lib/soft-delete";
import { companySearchFilter } from "@/lib/search";
import { requireSession } from "@/lib/auth";
import { unauthorized, badRequest, internalError } from "@/lib/errors";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    if (!session) return unauthorized();

    const { searchParams } = new URL(request.url);
    const params = parsePagination(searchParams, "name");

    const where: Record<string, unknown> = { ...notDeleted };
    if (params.q) Object.assign(where, companySearchFilter(params.q));

    const country = searchParams.get("country");
    if (country) where.country = country;
    const industry = searchParams.get("industry");
    if (industry) where.industry = industry;

    const [data, total] = await Promise.all([
      prisma.company.findMany({ where, ...prismaPaginationArgs(params) }),
      prisma.company.count({ where }),
    ]);

    return NextResponse.json(paginatedResponse(data, total, params));
  } catch (err) {
    console.error("GET /api/v1/companies error:", err);
    return internalError();
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (!session) return unauthorized();

    const body = await request.json();
    const { name, website, industry, headcount, annualRevenue, city, region, country, notes } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return badRequest("Validation failed.", [
        { field: "name", message: "Company name is required.", rule: "required" },
      ]);
    }

    const company = await prisma.company.create({
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
        createdBy: session.userId,
        updatedBy: session.userId,
      },
    });

    return NextResponse.json({ data: company }, { status: 201 });
  } catch (err) {
    console.error("POST /api/v1/companies error:", err);
    return internalError();
  }
}
