"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCReact, httpBatchLink, TRPCClientError } from "@trpc/react-query";
import superjson from "superjson";
import type { AppRouter } from "@/server/routers/_app";

export const trpc = createTRPCReact<AppRouter>();

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, retry: false } } }),
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({ links: [httpBatchLink({ url: "/api/trpc", transformer: superjson })] }),
  );
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

export function isConflict(error: unknown) {
  return error instanceof TRPCClientError && error.data?.code === "CONFLICT";
}
