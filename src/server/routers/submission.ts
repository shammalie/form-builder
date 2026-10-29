import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { formDefinitionSchema } from "@/forms/definition";
import { buildZodSchema } from "@/forms/build-zod-schema";
import { publicProcedure, router } from "../trpc";

export const submissionRouter = router({
  create: publicProcedure
    .input(z.object({ formVersionId: z.string(), data: z.record(z.string(), z.unknown()) }))
    .mutation(async ({ ctx, input }) => {
      const version = await ctx.db.formVersion.findUnique({
        where: { id: input.formVersionId },
        include: { form: true },
      });
      if (!version || !version.published || version.form.archivedAt) {
        throw new TRPCError({ code: "CONFLICT", message: "This form was updated, please reload" });
      }
      // Never trust a client schema: rebuild it from the stored version.
      const definition = formDefinitionSchema.parse(version.definition);
      const result = buildZodSchema(definition).safeParse(input.data);
      if (!result.success) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid submission", cause: result.error });
      }
      const submission = await ctx.db.submission.create({
        data: { formVersionId: version.id, data: JSON.parse(JSON.stringify(result.data)) },
      });
      return { submissionId: submission.id };
    }),

  list: publicProcedure.input(z.object({ formId: z.string() })).query(async ({ ctx, input }) => {
    const form = await ctx.db.form.findUnique({
      where: { id: input.formId },
      include: {
        versions: {
          orderBy: { version: "desc" },
          include: { submissions: { orderBy: { createdAt: "desc" } } },
        },
      },
    });
    if (!form) throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
    return {
      title: form.title,
      versions: form.versions
        .filter((v) => v.submissions.length > 0)
        .map((v) => ({
          versionId: v.id,
          version: v.version,
          published: v.published,
          definition: formDefinitionSchema.parse(v.definition),
          submissions: v.submissions.map((s) => ({
            id: s.id,
            createdAt: s.createdAt,
            data: s.data as Record<string, unknown>,
          })),
        })),
    };
  }),
});
