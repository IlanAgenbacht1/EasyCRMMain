// =============================================================================
// Pagination, Sorting & Search (Spec Section 7.2)
//
// All list endpoints accept: page, limit, sort, order, q
// Response envelope: { data, meta: { page, limit, total, totalPages } }
// =============================================================================

/** Parsed pagination parameters with validated defaults. */
export interface PaginationParams {
  page: number;
  limit: number;
  sort: string;
  order: "asc" | "desc";
  q?: string;
}

/** The standard paginated response envelope from Section 7.2. */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 25;

/**
 * Parse pagination query parameters from a request URL.
 * Applies defaults and clamps values to safe ranges.
 */
export function parsePagination(
  searchParams: URLSearchParams,
  defaultSort: string = "created_at"
): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
  );
  const sort = searchParams.get("sort") ?? defaultSort;
  const order = searchParams.get("order") === "desc" ? "desc" : "asc";
  const q = searchParams.get("q")?.trim() || undefined;

  return { page, limit, sort, order, q };
}

/**
 * Build Prisma `skip`, `take`, and `orderBy` arguments from parsed params.
 */
export function prismaPaginationArgs(params: PaginationParams) {
  return {
    skip: (params.page - 1) * params.limit,
    take: params.limit,
    orderBy: { [params.sort]: params.order },
  };
}

/**
 * Build the standard paginated response envelope.
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  return {
    data,
    meta: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  };
}
