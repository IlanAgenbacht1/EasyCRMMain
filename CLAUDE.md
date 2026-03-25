# EasyCRM — Implementation Guide for Claude Code

This is the architecture and implementation reference for the EasyCRM web application. Follow this document exactly. Do not invent patterns, add libraries, or deviate from what is specified here. When in doubt, keep it simple.

---

## Project Overview

EasyCRM is a lightweight, multi-user CRM web application. It manages Companies, Contacts, and Opportunities with shared editing, PIN-based authentication, and a mobile-first UI.

## Tech Stack — Do Not Change

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict)
- **Database:** PostgreSQL via Neon
- **ORM:** Prisma
- **PIN hashing:** bcryptjs
- **Styling:** Tailwind CSS
- **Hosting:** Netlify

Do not add additional ORMs, state management libraries, component libraries (no Material UI, Chakra, shadcn, etc.), or authentication frameworks (no NextAuth, Clerk, etc.). The auth system is custom and already scaffolded.

---

## Existing Files — Already Written, Do Not Rewrite

The following files exist in the project and are complete. Import and use them as-is. Do not duplicate their logic.

### `prisma/schema.prisma`
The complete database schema. Four models: User, Company, Contact, Opportunity. All models include audit columns (created_at, updated_at, created_by, updated_by) and soft-delete columns (deleted_at, deleted_by). Run `npx prisma migrate dev --name init` to create tables.

### `prisma/seed.ts`
Sample data: 1 admin user (username: "admin", PIN: "123456"), 5 companies, 7 contacts, 6 opportunities. Run via `npx prisma db seed` after adding this to package.json:
```json
{ "prisma": { "seed": "tsx prisma/seed.ts" } }
```

### `src/lib/prisma.ts`
Prisma client singleton. Import as: `import { prisma } from "@/lib/prisma";`

### `src/lib/pagination.ts`
Exports three functions:
- `parsePagination(searchParams, defaultSort)` — parses page, limit, sort, order, q from URL query string.
- `prismaPaginationArgs(params)` — returns `{ skip, take, orderBy }` for Prisma queries.
- `paginatedResponse(data, total, params)` — wraps results in `{ data, meta: { page, limit, total, totalPages } }`.

### `src/lib/errors.ts`
Standard error response helpers. Each returns a NextResponse:
- `badRequest(message, details?)` — 400
- `unauthorized(message?)` — 401
- `notFound(message?)` — 404
- `conflict(message, code?)` — 409
- `dependencyExists(message)` — 409 with DEPENDENCY_EXISTS code
- `unprocessable(message, details?)` — 422
- `rateLimited(message?)` — 429
- `internalError(message?)` — 500

Error envelope format: `{ error: { code, message, details? } }`
Field-level details format: `{ field, message, rule }`

### `src/lib/soft-delete.ts`
Exports:
- `notDeleted` — the object `{ deletedAt: null }`. Spread into every Prisma `where` clause.
- `softDeleteData(userId)` — returns `{ deletedAt: new Date(), deletedBy: userId }`.
- `softDeleteCompanyCascade(companyId, userId)` — transactionally soft-deletes a company and all its active contacts and opportunities.
- `restoreCompany(companyId)` — clears deleted_at and deleted_by on a company only.

### `src/lib/search.ts`
Exports search filter builders for each entity. Each returns a Prisma-compatible `{ OR: [...] }` clause using case-insensitive partial matching:
- `companySearchFilter(q)` — searches name, city, country, industry.
- `contactSearchFilter(q)` — searches firstName, lastName, email, phone.
- `opportunitySearchFilter(q)` — searches type, funnelStage, status, and nested company name.

### `src/lib/auth.ts`
Exports:
- `getSession()` — reads the session cookie, returns `{ userId, username }` or null.
- `setSession(session)` — sets an HTTP-only base64 cookie with 24-hour expiry.
- `clearSession()` — clears the session cookie.
- `requireSession()` — alias for getSession (returns session or null).
- `isLockedOut(lockedUntil)` — checks if a lockout timestamp is still active.
- `recordFailedAttempt(userId, currentFailCount)` — increments failure count, locks after 5 attempts for 15 minutes.
- `clearFailedAttempts(userId)` — resets counter and lockout.
- `findActiveUser(username)` — finds a non-deleted, active user by username.

### `src/lib/constants.ts`
Exports:
- `FUNNEL_STAGES` — readonly array: Lead, Qualified, Discovery, Proposal, Demo, Negotiation, Closed.
- `STATUSES` — readonly array: Open, Won, Lost, On Hold.
- `isValidFunnelStage(value)` — type guard.
- `isValidStatus(value)` — type guard.

---

## Target Project Structure

```
prisma/
  schema.prisma                    [EXISTS]
  seed.ts                          [EXISTS]

src/
  lib/
    prisma.ts                      [EXISTS]
    pagination.ts                  [EXISTS]
    errors.ts                      [EXISTS]
    soft-delete.ts                 [EXISTS]
    search.ts                      [EXISTS]
    auth.ts                        [EXISTS]
    constants.ts                   [EXISTS]

  app/
    layout.tsx                     [BUILD] Root layout — Tailwind, global styles, font
    page.tsx                       [BUILD] Redirects to /login or /companies based on session
    login/
      page.tsx                     [BUILD] Login screen

    (authenticated)/
      layout.tsx                   [BUILD] Authenticated layout — top bar, bottom nav, session check
      companies/
        page.tsx                   [BUILD] Companies list
        new/page.tsx               [BUILD] Create company form
        [id]/
          page.tsx                 [BUILD] Company detail
          edit/page.tsx            [BUILD] Edit company form
      contacts/
        page.tsx                   [BUILD] Contacts list
        new/page.tsx               [BUILD] Create contact form
        [id]/
          page.tsx                 [BUILD] Contact detail
          edit/page.tsx            [BUILD] Edit contact form
      opportunities/
        page.tsx                   [BUILD] Opportunities list
        new/page.tsx               [BUILD] Create opportunity form
        [id]/
          page.tsx                 [BUILD] Opportunity detail
          edit/page.tsx            [BUILD] Edit opportunity form
      users/
        page.tsx                   [BUILD] User management list
        new/page.tsx               [BUILD] Create user form

    api/v1/
      auth/
        login/route.ts             [BUILD]
        logout/route.ts            [BUILD]
        me/route.ts                [BUILD]
      companies/
        route.ts                   [BUILD] GET (list) + POST (create)
        [id]/route.ts              [BUILD] GET + PUT + DELETE
      contacts/
        route.ts                   [BUILD] GET (list) + POST (create)
        [id]/route.ts              [BUILD] GET + PUT + DELETE
      companies/
        [companyId]/
          contacts/route.ts        [BUILD] GET contacts for a company
          opportunities/route.ts   [BUILD] GET opportunities for a company
      opportunities/
        route.ts                   [BUILD] GET (list) + POST (create)
        [id]/route.ts              [BUILD] GET + PUT + DELETE
      users/
        route.ts                   [BUILD] GET (list) + POST (create)
        [id]/
          route.ts                 [BUILD] PUT (update user)
          reset-pin/route.ts       [BUILD] POST (reset PIN)
        change-pin/route.ts        [BUILD] POST (change own PIN)
```

---

## Build Order — Follow This Sequence

Build and fully complete each phase before moving to the next. Each phase should result in working, testable functionality.

### Phase 1: Project Initialisation
1. Initialise the Next.js project with TypeScript and Tailwind CSS if not already done.
2. Install dependencies: `prisma`, `@prisma/client`, `bcryptjs`, `@types/bcryptjs`, `tsx`.
3. Set up `DATABASE_URL` in `.env`.
4. Run `npx prisma migrate dev --name init`.
5. Run `npx prisma db seed`.
6. Verify seed data with `npx prisma studio`.

### Phase 2: Root Layout and Global UI Shell
Build the root layout and the authenticated layout with navigation. This gives every subsequent page a frame to live in.

- `src/app/layout.tsx` — HTML shell, Tailwind, base font.
- `src/app/(authenticated)/layout.tsx` — sticky top bar (app name left, user menu right), mobile bottom navigation bar (Companies, Contacts, Opportunities tabs), session check that redirects to /login if not authenticated.
- The bottom nav must highlight the active tab.
- The top bar user menu should show the logged-in username and a logout option.

### Phase 3: Companies (End-to-End)
This is the most important phase. It establishes every pattern that Contacts and Opportunities will copy.

**API routes:**

`GET /api/v1/companies` — list with pagination, search, and filters.
```
Query params: page, limit, sort, order, q, country, industry
Default sort: name (asc)
```
Pattern:
```typescript
import { prisma } from "@/lib/prisma";
import { parsePagination, prismaPaginationArgs, paginatedResponse } from "@/lib/pagination";
import { notDeleted } from "@/lib/soft-delete";
import { companySearchFilter } from "@/lib/search";
import { requireSession } from "@/lib/auth";
import { unauthorized } from "@/lib/errors";

export async function GET(request: Request) {
  const session = await requireSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(request.url);
  const params = parsePagination(searchParams, "name");

  const where: any = { ...notDeleted };
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
}
```

`POST /api/v1/companies` — create.
- Validate: name is required (return badRequest with field-level detail if missing).
- Set created_by and updated_by from session.userId.
- Return 201 with the created record.

`GET /api/v1/companies/[id]` — get single.
- Include `...notDeleted` in where clause.
- Include contacts and opportunities counts (active only) in the response.
- Return notFound() if no record.

`PUT /api/v1/companies/[id]` — update.
- Set updated_by from session.userId.
- Validate name is required.
- Return notFound() if no active record.

`DELETE /api/v1/companies/[id]` — soft-delete.
- Check for active contacts and opportunities. If they exist, return dependencyExists() unless request body includes `{ "cascade": true }`.
- If cascade confirmed, call `softDeleteCompanyCascade()`.
- If no dependents, soft-delete the company directly.
- Return 200 with the soft-deleted record.

`GET /api/v1/companies/[companyId]/contacts` — contacts for a company.
- Filter by companyId, apply notDeleted, paginate normally.

`GET /api/v1/companies/[companyId]/opportunities` — opportunities for a company.
- Filter by companyId, apply notDeleted, paginate normally.

**UI pages:**

Companies List (`/companies`):
- Search bar at top, filters for Country and Industry (as a collapsible filter drawer).
- List items show: Company Name (bold), City + Country (small), Industry (small).
- Floating "+" button fixed to bottom-right to create a new company.
- Pagination controls at bottom (Previous / Next with page indicator).
- Fetch from `GET /api/v1/companies` with query parameters.
- Empty state message when no companies exist.

Company Detail (`/companies/[id]`):
- Header: Company Name, Website (clickable link), Location (City, Region, Country).
- Overview section: Industry, Headcount, Annual Revenue (formatted as currency).
- Contacts section: list of contacts at this company (Name + Title). Link to add contact.
- Opportunities section: list of opportunities (Type | Stage | Status | Value). Link to add opportunity.
- Notes section: display notes text.
- Edit and Delete buttons.
- Delete shows confirmation dialog. If company has children, explain cascade and require confirmation.

Create Company (`/companies/new`):
- Form with fields: Name (required), Website, Industry, Headcount, Annual Revenue, City, Region, Country, Notes.
- Submit POSTs to `/api/v1/companies`.
- On success, redirect to the new company's detail page.
- Show validation errors from the API response inline on the form.

Edit Company (`/companies/[id]/edit`):
- Same form as Create, pre-populated with existing data.
- Submit PUTs to `/api/v1/companies/[id]`.
- On success, redirect back to detail page.

### Phase 4: Contacts (End-to-End)
Follow the exact same API and UI patterns established in Phase 3.

**API specifics:**
- `GET /api/v1/contacts` — supports q, company_id filter. Default sort: lastName (asc).
- `POST /api/v1/contacts` — required fields: firstName, lastName, companyId. Validate companyId references an active company.
- `GET /api/v1/contacts/[id]` — include parent company name in response.
- `PUT /api/v1/contacts/[id]` — same validation as create.
- `DELETE /api/v1/contacts/[id]` — simple soft-delete, no cascade.

**UI specifics:**
- Contacts List: search by name/email/phone. Optional company filter dropdown. List item: Name (bold), Company, Email or Phone.
- Contact Detail: Name + Title, Company (clickable link to company detail), Email (mailto link), Phone (tap-to-call link), Notes. Edit and Delete buttons.
- Create/Edit: form with Company (dropdown selector), First Name, Last Name, Title, Email, Phone, Notes.

### Phase 5: Opportunities (End-to-End)
Follow the same patterns. This entity adds the compound detail view.

**API specifics:**
- `GET /api/v1/opportunities` — supports q, funnel_stage, status, rep filters. Default sort: createdAt (desc).
- `POST /api/v1/opportunities` — required: companyId, funnelStage, status. Validate funnelStage against `isValidFunnelStage()` and status against `isValidStatus()` from constants.ts.
- `GET /api/v1/opportunities/[id]` — **this is the compound endpoint**. Return the opportunity, a company summary (id, name, website, city, country), and the list of active contacts at that company (id, firstName, lastName, title, email, phone). Structure:
```json
{
  "data": {
    "id": "...",
    "type": "...",
    "funnelStage": "...",
    "status": "...",
    "value": "...",
    "rep": "...",
    "notes": "...",
    "company": { "id": "...", "name": "...", "website": "...", "city": "...", "country": "..." },
    "companyContacts": [
      { "id": "...", "firstName": "...", "lastName": "...", "title": "...", "email": "...", "phone": "..." }
    ]
  }
}
```
- `DELETE /api/v1/opportunities/[id]` — simple soft-delete, no cascade.

**UI specifics:**
- Opportunities List: search, filter by Stage, Status, Rep. List item: Company name (bold), Type + Stage + Status, Value (right-aligned, formatted as currency).
- Opportunity Detail: Main section with Type, Funnel Stage, Status, Value (currency), Rep, Notes. **Required Contacts Panel**: titled "Contacts at {Company Name}", showing each contact's Name (bold), Email (clickable), Phone (tap-to-call). "View all contacts" link to the company's contacts. Optional "+ Add Contact" link. Edit and Delete buttons.
- Create/Edit: form with Company (dropdown), Type (free text), Funnel Stage (dropdown from FUNNEL_STAGES), Status (dropdown from STATUSES), Value (number input), Rep (text), Notes.

### Phase 6: Authentication
Build the auth API routes and login page, then protect all existing routes.

**API routes:**

`POST /api/v1/auth/login`:
- Accept `{ username, pin }`.
- Find user via `findActiveUser(username)`.
- If no user found, return unauthorized("Invalid credentials."). Do not reveal whether the username exists.
- If user is locked out via `isLockedOut()`, return rateLimited("Account locked. Try again later.").
- Compare PIN using `bcrypt.compare(pin, user.pinHash)`.
- If mismatch, call `recordFailedAttempt()` and return unauthorized("Invalid credentials.").
- If match, call `clearFailedAttempts()`, call `setSession()`, return 200 with user info (id, username, displayName).

`POST /api/v1/auth/logout`:
- Call `clearSession()`.
- Return 200 `{ message: "Logged out." }`.

`GET /api/v1/auth/me`:
- Call `getSession()`.
- If no session, return unauthorized().
- Return session user info.

**Login page (`/login`):**
- App title at top.
- Username input (text).
- PIN input (masked, inputmode="numeric" for mobile numeric keypad).
- Login button.
- Error message display area (shows API error messages).
- If already authenticated (session exists), redirect to /companies.

**Protecting routes:**
- Add `const session = await requireSession(); if (!session) return unauthorized();` to the top of EVERY existing API route handler (GET, POST, PUT, DELETE).
- The authenticated layout (`src/app/(authenticated)/layout.tsx`) should check for a session on the server side and redirect to /login if not present.

### Phase 7: User Management
Build user admin endpoints and a simple user management page.

**API routes:**

`GET /api/v1/users` — list all active users (with notDeleted filter). Do NOT return pinHash in the response. Paginated.

`POST /api/v1/users` — create a new user.
- Accept: `{ username, pin, displayName? }`.
- Validate: username required and unique, pin required and minimum 6 digits (numeric only).
- Hash the PIN with `bcrypt.hash(pin, 12)`.
- Return 201 with user (excluding pinHash).

`PUT /api/v1/users/[id]` — update user.
- Can update: displayName, isActive.
- Cannot update: username, pinHash (use reset-pin for that).

`POST /api/v1/users/[id]/reset-pin` — reset another user's PIN.
- Accept: `{ pin }`.
- Validate: minimum 6 digits.
- Hash and update.
- Clear failed attempt counter and lockout.
- Return 200.

`POST /api/v1/users/change-pin` — change own PIN.
- Accept: `{ currentPin, newPin }`.
- Verify current PIN matches.
- Validate new PIN: minimum 6 digits.
- Hash and update.
- Return 200.

**UI page (`/users`):**
- Simple list of users: Username, Display Name, Active status.
- Create User button (opens /users/new form).
- Each user row has: Disable/Enable toggle, Reset PIN button.
- Reset PIN shows a modal/dialog to enter new PIN.
- Create User form: Username, Display Name, PIN (masked), Confirm PIN. Submit to POST /api/v1/users.

---

## Mandatory Patterns — Apply Everywhere

### Every API Route Must:
1. Check authentication: `const session = await requireSession(); if (!session) return unauthorized();`
2. Filter soft-deleted records: always include `...notDeleted` in Prisma where clauses.
3. Set audit fields on create: `createdBy: session.userId, updatedBy: session.userId`.
4. Set audit fields on update: `updatedBy: session.userId`.
5. Use the error helpers from `@/lib/errors` — never construct raw JSON error responses.
6. Return standard pagination envelope for all list endpoints using `paginatedResponse()`.
7. Wrap database operations in try/catch and return `internalError()` on unexpected failures.

### Every List API Route Must:
1. Parse params with `parsePagination(searchParams, defaultSortField)`.
2. Build where clause starting with `{ ...notDeleted }`.
3. Add search filter if `params.q` is present using the appropriate search helper.
4. Add entity-specific filters from query params.
5. Run `findMany` and `count` in parallel with `Promise.all`.
6. Return with `paginatedResponse(data, total, params)`.

### Every UI Page Must:
1. Handle loading state (show a spinner or skeleton).
2. Handle error state (show the error message from the API).
3. Handle empty state (friendly message when no records exist, with a call to action).
4. Be mobile-responsive (mobile-first, works on small screens).

### Every Form Must:
1. Show inline validation errors mapped from the API error.details array.
2. Disable the submit button while the request is in flight.
3. Redirect to the appropriate detail or list page on success.
4. Show a confirmation dialog before destructive actions (delete, disable user, reset PIN).

### Sensitive Data Rules:
- NEVER return pinHash in any API response. Use Prisma `select` or `omit` to exclude it.
- NEVER log PIN values.

---

## UI Design Specifications

### Global Shell
- **Top bar:** Sticky, contains app name "EasyCRM" on the left. Search icon and user menu on the right. The user menu shows the logged-in display name and a logout option.
- **Bottom navigation (mobile):** Fixed bottom bar with three tabs — Companies, Contacts, Opportunities. Active tab is visually highlighted. Use icons with labels.
- **On larger screens (md+):** Bottom nav can become a left sidebar. Top bar spans full width.

### Design Principles
- Mobile-first. Design for 375px width, scale up.
- Clean, minimal, professional. White background, subtle grey borders.
- Use Tailwind utility classes only. No custom CSS files.
- Typography: system font stack via Tailwind defaults.
- Primary action colour: blue-600. Destructive actions: red-600.
- Floating action button (FAB) for "create new" actions: fixed position, bottom-right, circular, blue-600 background with white plus icon.
- Form inputs: full width, clear labels above, consistent padding and border radius.
- Cards/list items: subtle border or shadow, consistent padding, tap-friendly minimum height (48px) on mobile.

### Login Screen
- Centered card layout, max-width sm.
- App title "EasyCRM" prominently displayed.
- Username input: type="text", autocomplete="username".
- PIN input: type="password", inputmode="numeric", pattern="[0-9]*", autocomplete="current-password". This triggers the numeric keypad on mobile.
- Full-width login button, blue-600.
- Error messages displayed in red-600 text below the form.

### List Screens (Companies, Contacts, Opportunities)
- Search bar at the top of the content area, not in the top bar.
- Filter controls below search, collapsible on mobile (toggle with a "Filters" button).
- List items as cards or rows with clear visual hierarchy.
- Pagination at bottom: "Previous" / "Next" buttons with "Page X of Y" indicator.
- Floating "+" action button (bottom-right) to create new records.

### Detail Screens
- Back button or breadcrumb at top.
- Entity name/title as the page heading.
- Sections with clear headings.
- Edit and Delete buttons (Edit as primary, Delete as text/outline in red).
- Related entities (contacts on company, contacts panel on opportunity) shown as compact lists within the detail view.

### Forms (Create / Edit)
- Single column layout.
- Labels above inputs.
- Required fields marked with asterisk.
- Dropdowns for: Company (select from active companies), Funnel Stage (from FUNNEL_STAGES), Status (from STATUSES).
- Text areas for Notes fields.
- Number inputs for Value, Headcount, Annual Revenue.
- Save button (primary, blue-600) and Cancel link.

---

## Currency and Number Formatting

- Monetary values (Annual Revenue, Opportunity Value) should display formatted with commas and two decimal places, prefixed with "$". Example: $125,000.00.
- Headcount should display as a plain integer with commas. Example: 1,250.
- Use `Intl.NumberFormat` for formatting on the client side.

---

## What NOT to Build

These are explicitly out of scope for V1. Do not implement them:
- Tasks, reminders, or follow-ups
- Email integration
- File attachments
- Import/export (CSV, etc.)
- Dashboards or reporting charts
- Role-based access control (all users are equal in V1)
- Real-time updates / WebSockets
- Dark mode
- Internationalisation (i18n)

---

## Troubleshooting Checklist

If something isn't working, check these common issues:

1. **Deleted records appearing in lists:** You forgot `...notDeleted` in the where clause.
2. **created_by/updated_by is null:** You forgot to set audit fields from session.userId.
3. **Prisma relation errors:** Make sure you're using the Prisma field names (camelCase like `companyId`, `firstName`) not the database column names (snake_case like `company_id`, `first_name`).
4. **PIN comparison failing:** Make sure you're using `bcrypt.compare(plainPin, hashedPin)`, not comparing strings directly.
5. **Session not persisting:** Check that cookies are being set with `path: "/"` and that you're not mixing server/client components incorrectly.
6. **Pagination returning wrong results:** Check that `skip` and `take` are calculated correctly — `skip = (page - 1) * limit`.
7. **Search not working:** Prisma `contains` with `mode: "insensitive"` requires the field to be a string type. Nullable fields need to be handled (Prisma skips null fields in OR conditions, which is fine).
