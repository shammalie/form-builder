import { router } from "../trpc";
import { formRouter } from "./form";
import { submissionRouter } from "./submission";

export const appRouter = router({
  form: formRouter,
  submission: submissionRouter,
});

export type AppRouter = typeof appRouter;
