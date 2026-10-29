import { isDeepStrictEqual } from "node:util";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { formDefinitionSchema, type FormDefinition } from "@/forms/definition";
import { publicProcedure, router } from "../trpc";

const formId = z.object({ formId: z.string() });

// Drops `undefined` keys so stored JSON and no-op comparisons are stable.
const toJson = (d: FormDefinition): FormDefinition => JSON.parse(JSON.stringify(d));

export const formRouter = router({
  list: publicProcedure.query(async ({ ctx }) => {
    const forms = await ctx.db.form.findMany({
      where: { archivedAt: null },
      orderBy: { updatedAt: "desc" },
      include: { versions: { select: { version: true, published: true } } },
    });
    return forms.map((f) => ({
      id: f.id,
      title: f.title,
      latestVersion: Math.max(0, ...f.versions.map((v) => v.version)),
      publishedVersion: f.versions.find((v) => v.published)?.version ?? null,
      updatedAt: f.updatedAt,
    }));
  }),

  getLatest: publicProcedure.input(formId).query(async ({ ctx, input }) => {
    const v = await ctx.db.formVersion.findFirst({
      where: { formId: input.formId, form: { archivedAt: null } },
      orderBy: { version: "desc" },
    });
    if (!v) throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
    return {
      versionId: v.id,
      version: v.version,
      published: v.published,
      definition: formDefinitionSchema.parse(v.definition),
    };
  }),

  getPublished: publicProcedure.input(formId).query(async ({ ctx, input }) => {
    const v = await ctx.db.formVersion.findFirst({
      where: { formId: input.formId, published: true, form: { archivedAt: null } },
    });
    if (!v) return null;
    return { versionId: v.id, version: v.version, definition: formDefinitionSchema.parse(v.definition) };
  }),

  create: publicProcedure
    .input(z.object({ definition: formDefinitionSchema }))
    .mutation(async ({ ctx, input }) => {
      const definition = toJson(input.definition);
      const form = await ctx.db.form.create({
        data: { title: definition.title, versions: { create: { version: 1, definition } } },
        include: { versions: true },
      });
      return { formId: form.id, versionId: form.versions[0].id, version: 1 };
    }),

  saveVersion: publicProcedure
    .input(z.object({ formId: z.string(), definition: formDefinitionSchema }))
    .mutation(({ ctx, input }) =>
      ctx.db.$transaction(async (tx) => {
        const definition = toJson(input.definition);
        const latest = await tx.formVersion.findFirst({
          where: { formId: input.formId },
          orderBy: { version: "desc" },
        });
        if (latest && isDeepStrictEqual(latest.definition, definition)) {
          return { versionId: latest.id, version: latest.version, created: false };
        }
        // A concurrent save picking the same number hits @@unique([formId, version]) -> CONFLICT.
        const v = await tx.formVersion.create({
          data: { formId: input.formId, version: (latest?.version ?? 0) + 1, definition },
        });
        await tx.form.update({ where: { id: input.formId }, data: { title: definition.title } });
        return { versionId: v.id, version: v.version, created: true };
      }),
    ),

  publish: publicProcedure
    .input(z.object({ formId: z.string(), versionId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.db.$transaction(async (tx) => {
        // Unpublish first, or the partial unique index rejects the second update.
        // A racing publish that commits in between makes our update hit the index -> P2002 -> CONFLICT.
        await tx.formVersion.updateMany({
          where: { formId: input.formId, published: true },
          data: { published: false },
        });
        const v = await tx.formVersion.update({
          where: { id: input.versionId, formId: input.formId },
          data: { published: true },
        });
        return { versionId: v.id, version: v.version };
      }),
    ),

  listVersions: publicProcedure.input(formId).query(async ({ ctx, input }) => {
    const versions = await ctx.db.formVersion.findMany({
      where: { formId: input.formId },
      orderBy: { version: "desc" },
      select: { id: true, version: true, published: true, createdAt: true, _count: { select: { submissions: true } } },
    });
    return versions.map((v) => ({
      versionId: v.id,
      version: v.version,
      published: v.published,
      createdAt: v.createdAt,
      submissionCount: v._count.submissions,
    }));
  }),

  archive: publicProcedure.input(formId).mutation(async ({ ctx, input }) => {
    await ctx.db.form.update({ where: { id: input.formId }, data: { archivedAt: new Date() } });
    return { ok: true };
  }),
});
