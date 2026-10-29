-- At most one published version per form. Prisma's schema language can't express
-- a partial unique index, so it lives only here: delete any DROP INDEX line for it
-- that a future `migrate dev --create-only` generates.
CREATE UNIQUE INDEX "FormVersion_one_published_per_form"
  ON "FormVersion" ("formId")
  WHERE "published" = true;
