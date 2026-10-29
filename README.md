# Form Builder

A small, generic form builder (learning project). Build a form, save immutable versions,
publish one version, fill it in, and view submissions grouped by version.

Stack: Next.js (App Router) + tRPC v11 + TanStack Query + Prisma/Postgres + React Hook Form + Zod v4 + shadcn/ui.

## Run locally

```bash
cp .env.example .env            # point DATABASE_URL at a local Postgres
npm install
npx prisma migrate dev          # includes the partial unique index migration
npm run dev                     # http://localhost:3000
```

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
