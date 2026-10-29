import { Suspense } from "react";

// Pages under [formId] read the id with useParams(); with Cache Components that
// runtime value must stream in inside a Suspense boundary.
export default function FormLayout({ children }: LayoutProps<"/forms/[formId]">) {
  return <Suspense fallback={<p className="text-muted-foreground">Loading…</p>}>{children}</Suspense>;
}
