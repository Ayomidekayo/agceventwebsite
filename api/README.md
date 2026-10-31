# AGN Conference API

NestJS API for the AGN 2027 conference platform. It is designed to work with the Vite + React frontend in the companion project and uses PostgreSQL through Prisma ORM 7.8.0.

## Architecture

Feature modules use a Controller → Service → Repository → Prisma pattern:

- `auth`: administrator login, session lifecycle, current user, invitation acceptance.
- `registrations`: public participant registration and protected administration.
- `volunteers`: public applications and protected review/status management.
- `sponsorships`: public enquiries, protected status updates, commitments and verified receipts.
- `admin/dashboard`: permission-aware summary metrics and recent activity.
- `admin/users`: Super Admin invitations, role changes and active-state controls.
- `public`: published event, speaker and session data.
- `common`: guards, role metadata, request types and utilities.
- `prisma`: shared Prisma 7 client service and central generated-client exports.

## Prisma 7.8.0 setup

This API deliberately uses the Prisma 7 `prisma-client` generator with the requested output path:

```prisma
generator client {
  provider     = "prisma-client"
  output       = "../src/generated/prisma"
  moduleFormat = "cjs"
}

datasource db {
  provider = "postgresql"
}
```

The database URL is configured in `prisma.config.ts`. Both `prisma` and `@prisma/client` and the PostgreSQL adapter are pinned to `7.8.0`.

## Preserve your existing database

1. Keep your real `.env` in this API folder. If you already have a working `api/.env`, preserve it exactly; do not overwrite its `DATABASE_URL`, `SESSION_SECRET`, or seed credentials. Copy `.env.example` only when no `.env` exists, then configure every placeholder.
2. If your existing project contains `prisma/migrations`, preserve and copy that folder into this API's `prisma/` folder before running migration commands. This source archive intentionally does not invent a baseline migration or replace database history.
3. Do **not** run `prisma migrate reset` against the existing AGN database.
4. The seed upserts the event by slug and administrator by email. It does not delete participant, volunteer, sponsorship or audit records.

## Install and run on Windows PowerShell

```powershell
cd api
if (!(Test-Path .env)) { Copy-Item .env.example .env }
npm install
npm run prisma:generate
npm run build
npm run start:dev
```

`npm run start:dev` and `npm run build` generate the client before starting/compiling. `npm run prisma:seed` also generates it before running the seed.

API base URL: `http://localhost:5000/api/v1`

Health check: `GET http://localhost:5000/api/v1/health`

Seed the event and Super Admin only after confirming `.env` points to the intended existing database:

```powershell
npm run prisma:seed
```

The seed requires `ADMIN_SEED_EMAIL` and a unique `ADMIN_SEED_PASSWORD` of at least 12 characters. The password is hashed with bcrypt before storage.

## Existing API contract used by the Vite frontend

### Public

- `GET /public/event`
- `POST /registrations`
- `POST /volunteers`
- `POST /sponsorship-enquiries`

### Authentication

- `GET /auth/csrf`
- `POST /auth/login`
- `POST /auth/accept-invitation`
- `GET /auth/me`
- `POST /auth/logout`

### Administration

- `GET /admin/dashboard/summary`
- `GET /admin/registrations`
- `PATCH /admin/registrations/:id/status`
- `GET /admin/volunteers`
- `PATCH /admin/volunteers/:id/status`
- `GET /admin/sponsorship`
- `PATCH /admin/sponsorship/:id/status`
- `GET /admin/sponsorship/commitments`
- `POST /admin/sponsorship/commitments`
- `POST /admin/sponsorship/commitments/:id/receipts`
- `GET /admin/users`
- `POST /admin/users/invitations`
- `PATCH /admin/users/:id/active`
- `PATCH /admin/users/:id/role`

Protected routes use database-backed sessions and role guards. All state-changing requests require a session CSRF token via the `X-CSRF-Token` header. The companion frontend's Axios client already fetches and attaches this token.

## Production notes

- Use HTTPS and set `NODE_ENV=production` behind a trusted reverse proxy.
- Use a long, random `SESSION_SECRET` (32+ characters) and keep secrets outside source control.
- Configure `WEB_ORIGIN` to the exact deployed frontend origin(s), comma-separated if needed.
- Review and approve privacy/legal notices before collecting real participant data.
- Configure transactional email delivery before depending on automated user notifications.
- Load-test public registration and verify database backups/restoration before launch.
- Run the API build and end-to-end tests in the deployment pipeline.

## Verification status

This archive is source-complete for the existing modular API contract and Prisma 7.8.0 generator configuration. Prisma Client is generated on the user's machine after dependency installation. A dependency-backed NestJS build and live PostgreSQL integration test could not be run in this build environment, so run `npm run build` and test against the intended local database before deployment.
