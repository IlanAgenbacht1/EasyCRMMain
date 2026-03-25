# EasyCRM — Project Scaffold

Foundation files for the EasyCRM web application, matching the v1.1 specification.

> **For Claude Code:** Read `CLAUDE.md` in the project root before doing any work. It contains the complete implementation guide, build order, mandatory patterns, and UI specifications.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Database:** PostgreSQL via Neon
- **ORM:** Prisma
- **Auth:** bcryptjs for PIN hashing, HTTP-only cookie sessions
- **Hosting:** Netlify

## Setup

```bash
# 1. Install dependencies
npm install
npm install prisma @prisma/client bcryptjs
npm install -D @types/bcryptjs tsx

# 2. Set your Neon database URL
#    Create a .env file in the project root:
echo 'DATABASE_URL="postgresql://user:pass@your-neon-host/easycrm?sslmode=require"' > .env

# 3. Run the initial migration
npx prisma migrate dev --name init

# 4. Seed sample data
npx prisma db seed

# 5. Start development
npm run dev
```

Add the seed command to your `package.json`:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

## Project Structure

```
prisma/
  schema.prisma          Full schema — all tables, audit columns, soft-delete, indexes
  seed.ts                Sample data — 5 companies, 7 contacts, 6 opportunities, 1 admin user

src/
  lib/
    prisma.ts            Prisma client singleton
    pagination.ts        Parse query params, build Prisma args, format response envelope
    errors.ts            Standard error responses (400, 401, 404, 409, 422, 429, 500)
    soft-delete.ts       Active record filter, soft-delete helpers, cascade logic
    search.ts            Entity-specific search filters (ILIKE partial matching)
    auth.ts              Session read/write/clear, lockout logic, user lookup
    constants.ts         Hardcoded funnel stages and statuses (Section 6)

  app/
    api/v1/
      auth/
        login/route.ts   POST — authenticate with username + PIN
        logout/route.ts  POST — clear session cookie
        me/route.ts      GET  — return current user
      companies/
        route.ts         GET (list) / POST (create)
      contacts/
        route.ts         GET (list) / POST (create)
      opportunities/
        route.ts         GET (list) / POST (create)
      users/
        route.ts         GET (list) / POST (create)
```

Individual entity routes (`/companies/[id]/route.ts`, etc.) should be added as
you build each entity slice.

## Build Order

Work through the app in vertical slices. Each slice should be fully functional
before starting the next.

1. **Prisma schema + migration** — already provided, run the migration first.
2. **Seed data** — run the seed to have realistic data in every screen.
3. **Companies** — list, detail, create, edit, delete. This establishes all
   the patterns (pagination, search, soft-delete, error handling) that every
   other entity will reuse.
4. **Contacts** — same patterns, adds the company relationship.
5. **Opportunities** — adds the compound detail view (opportunity + company
   summary + company contacts panel).
6. **Authentication** — login, logout, session middleware, lockout logic.
   Apply the `requireSession()` check to all existing routes.
7. **User management** — list users, create user, disable user, reset PIN.

## Using the Utility Files

### Pagination (any list endpoint)

```typescript
import { parsePagination, prismaPaginationArgs, paginatedResponse } from "@/lib/pagination";
import { notDeleted } from "@/lib/soft-delete";
import { companySearchFilter } from "@/lib/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const params = parsePagination(searchParams, "name");

  const where = {
    ...notDeleted,
    ...(params.q ? companySearchFilter(params.q) : {}),
  };

  const [data, total] = await Promise.all([
    prisma.company.findMany({ where, ...prismaPaginationArgs(params) }),
    prisma.company.count({ where }),
  ]);

  return NextResponse.json(paginatedResponse(data, total, params));
}
```

### Soft-delete (any delete endpoint)

```typescript
import { softDeleteData, softDeleteCompanyCascade } from "@/lib/soft-delete";

// Simple entity (contact or opportunity):
await prisma.contact.update({
  where: { id },
  data: softDeleteData(session.userId),
});

// Company with cascade:
await softDeleteCompanyCascade(companyId, session.userId);
```

### Error responses

```typescript
import { badRequest, notFound, unauthorized } from "@/lib/errors";

if (!session) return unauthorized();
if (!company) return notFound("Company not found.");
if (!body.name) return badRequest("Name is required.", [
  { field: "name", message: "Name is required.", rule: "required" },
]);
```

## Environment Variables

| Variable       | Description                        |
|----------------|------------------------------------|
| `DATABASE_URL` | Neon Postgres connection string    |
| `NODE_ENV`     | `development` or `production`      |
