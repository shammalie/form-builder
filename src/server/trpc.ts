import { initTRPC, TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import superjson from "superjson";
import { z } from "zod";
import { db } from "./db";

export const createContext = () => ({ db });

const t = initTRPC.context<typeof createContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        fieldErrors: error.cause instanceof z.ZodError ? z.flattenError(error.cause).fieldErrors : null,
      },
    };
  },
});

// Unique-constraint violations (P2002) become CONFLICT so the client can say "reload and retry".
const mapPrismaErrors = t.middleware(async ({ next }) => {
  const result = await next();
  if (!result.ok) {
    const cause = result.error.cause;
    if (cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === "P2002") {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Someone else changed this form at the same time. Reload and try again.",
        cause,
      });
    }
  }
  return result;
});

export const router = t.router;
export const publicProcedure = t.procedure.use(mapPrismaErrors);
