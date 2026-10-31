# AGN Conference Platform — Architecture

## Applications

- `web/`: Vite + React + TypeScript public website and administration workspace.
- `api/`: NestJS REST API using PostgreSQL and Prisma ORM 6.19.3.

## Backend design

Feature modules are separated by business domain. The request path is:

`Controller → Service → Repository → Prisma/PostgreSQL`

- Controllers expose the HTTP routes consumed by the Vite application.
- DTOs validate and normalise incoming payloads.
- Services enforce business rules, consent, duplicate protection, workflow transitions and access-sensitive behavior.
- Repositories own Prisma reads, writes, aggregates and database transactions.
- Modules register controllers/providers for each feature.

## Backend modules

- `AuthModule`: login, logout, current administrator, CSRF token, one-time invitation acceptance.
- `PublicModule`: published conference, speakers and sessions.
- `RegistrationsModule`: public attendee registration and authorised administration.
- `VolunteersModule`: public volunteer applications and authorised review.
- `SponsorshipsModule`: public enquiries, admin enquiry workflow, commitments and verified receipts.
- `AdminModule`: dashboard reporting and Super Admin team access (composed from dashboard and admin-users modules).
- `PrismaModule`: shared Prisma client.
- `CommonModule`: session/role guards and shared utilities.

## Frontend API contract

Base URL: `VITE_API_BASE_URL`, normally `http://localhost:5000/api/v1` in local development. The API preserves the route paths and response shapes used by `web/src/App.tsx` and `web/src/lib/api.ts`.

## Database safety

The refactor does not alter `prisma/schema.prisma`. It is designed to work with the existing AGN schema and records. Regenerate the Prisma Client after installing the pinned packages. Check migration status before applying migrations. Never use `prisma migrate reset` against the existing AGN database.

## Authentication and access control

The API uses HTTP-only session cookies stored in PostgreSQL. The Vite Axios client uses `withCredentials: true`, fetches a CSRF token from `/auth/csrf`, and sends `X-CSRF-Token` on state-changing requests. Admin access is enforced in backend guards and role metadata. Registration check-in accounts receive a reduced set of participant fields. Report viewers receive aggregate dashboard statistics rather than person-level activity records.

## Local ports

- Vite: `http://localhost:5173`
- Nest API: `http://localhost:5000/api/v1`
- Prisma Studio: `http://localhost:5555`
