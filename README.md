# Form Builder

A small, generic form builder (learning project). Build a form, save immutable versions,
publish one version, fill it in, and view submissions grouped by version.

Stack: Next.js (App Router) + tRPC v11 + TanStack Query + Prisma/Postgres + React Hook Form + Zod v4 + shadcn/ui.

## Run locally

Requirements:

- Node.js 22 (see `.nvmrc`; `nvm use` picks it up). Node 20.9+ also works with Next.js 16.
- PostgreSQL 14+ running locally. Either of these works:
  - Docker: `docker run -d --name formbuilder-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=formbuilder -p 5432:5432 postgres:16`
  - Installed Postgres: `createdb formbuilder` (and adjust the user/password in `.env`)

Steps:

```bash
cp .env.example .env            # edit DATABASE_URL if your Postgres user/password/port differ
npm install                     # also generates the Prisma client
npx prisma migrate deploy       # applies all migrations, including the partial unique index
npm run dev                     # http://localhost:3000
```

There is no seed script: open http://localhost:3000/forms/new and create a form.

When you change `prisma/schema.prisma` later, use `npx prisma migrate dev --create-only --name <name>`,
review the SQL, then `npx prisma migrate dev` (see "Key ideas" below).

- `npm run typecheck` generates Next.js route types (`next typegen`) and runs `tsc`.
- `npm test` runs the Vitest unit tests for `formDefinitionSchema` and `buildZodSchema`.
- `npm run smoke` runs an end-to-end API check against the running dev server
  (create, versions, publish, submit, concurrent publish rejection, archive).

## Key ideas

- `src/forms/definition.ts`: the stored `FormDefinition` format (a Zod schema) and stable field ids.
- `src/forms/build-zod-schema.ts`: turns a definition into the runtime Zod schema used by both the
  renderer (RHF resolver) and the server (submission validation).
- `prisma/migrations/*_one_published_version`: hand-written partial unique index so at most one
  version per form is published. Always create migrations with `--create-only` and delete any
  generated `DROP INDEX "FormVersion_one_published_per_form"` line.
