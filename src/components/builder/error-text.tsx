export function ErrorText({ error }: { error?: { message?: string } }) {
  if (!error?.message) return null;
  return <p className="text-sm text-destructive">{error.message}</p>;
}
