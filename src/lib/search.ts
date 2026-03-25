// =============================================================================
// Search Helpers (Spec Section 7.2)
//
// Case-insensitive partial matching (ILIKE via Prisma `contains` + `insensitive`).
//
// Searchable fields per entity:
//   Companies:     name, city, country, industry
//   Contacts:      first_name, last_name, email, phone
//   Opportunities: type, funnel_stage, status (+ parent company name)
// =============================================================================

type SearchCondition = Record<string, { contains: string; mode: "insensitive" }>;

function ilike(field: string, term: string): SearchCondition {
  return { [field]: { contains: term, mode: "insensitive" } };
}

/**
 * Build a Prisma OR clause for searching companies.
 */
export function companySearchFilter(q: string) {
  return {
    OR: [
      ilike("name", q),
      ilike("city", q),
      ilike("country", q),
      ilike("industry", q),
    ],
  };
}

/**
 * Build a Prisma OR clause for searching contacts.
 */
export function contactSearchFilter(q: string) {
  return {
    OR: [
      ilike("firstName", q),
      ilike("lastName", q),
      ilike("email", q),
      ilike("phone", q),
    ],
  };
}

/**
 * Build a Prisma OR clause for searching opportunities.
 * Includes a nested search on the parent company name.
 */
export function opportunitySearchFilter(q: string) {
  return {
    OR: [
      ilike("type", q),
      ilike("funnelStage", q),
      ilike("status", q),
      { company: ilike("name", q) },
    ],
  };
}
