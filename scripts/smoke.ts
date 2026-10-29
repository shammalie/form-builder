// End-to-end smoke test against a running dev server: `npm run smoke`.
import { createTRPCClient, httpLink, TRPCClientError } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "../src/server/routers/_app";
import type { FormDefinition } from "../src/forms/definition";

const url = (process.env.BASE_URL ?? "http://localhost:3000") + "/api/trpc";
const api = createTRPCClient<AppRouter>({ links: [httpLink({ url, transformer: superjson })] });

const code = (e: unknown) => (e instanceof TRPCClientError ? e.data?.code : String(e));
function check(ok: boolean, msg: string) {
  console.log(`${ok ? "PASS" : "FAIL"} ${msg}`);
  if (!ok) process.exitCode = 1;
}

const v1: FormDefinition = {
  schemaVersion: 1,
  title: "Smoke test",
  fields: [
    { id: "nameAbc1", type: "text", label: "Name", required: true },
    { id: "colorXy2", type: "select", label: "Color", required: false, options: [{ label: "Red", value: "red" }] },
  ],
};

async function main() {
  const { formId, versionId: v1Id } = await api.form.create.mutate({ definition: v1 });
  check(!!formId, "create form -> v1");

  const v2 = { ...v1, fields: [{ ...v1.fields[0], label: "Full name" }, v1.fields[1]] };
  const s2 = await api.form.saveVersion.mutate({ formId, definition: v2 });
  check(s2.version === 2 && s2.created, "save renamed label -> v2");
  const noop = await api.form.saveVersion.mutate({ formId, definition: v2 });
  check(noop.version === 2 && !noop.created, "identical save is a no-op");
  const s3 = await api.form.saveVersion.mutate({
    formId,
    definition: { ...v2, fields: [...v2.fields, { id: "agreeQ3z", type: "checkbox", label: "Agree", required: true }] },
  });
  check(s3.version === 3, "save -> v3");

  check((await api.form.getPublished.query({ formId })) === null, "nothing published yet");
  await api.form.publish.mutate({ formId, versionId: v1Id });
  const pub1 = await api.form.getPublished.query({ formId });
  check(pub1?.version === 1, "publish v1");

  await api.submission.create.mutate({ formVersionId: v1Id, data: { nameAbc1: "Ada", colorXy2: "red" } });
  check(true, "submit against v1");
  try {
    await api.submission.create.mutate({ formVersionId: v1Id, data: { nameAbc1: "" } });
    check(false, "invalid submission rejected");
  } catch (e) {
    check(code(e) === "BAD_REQUEST", "invalid submission rejected (BAD_REQUEST)");
  }

  await api.form.publish.mutate({ formId, versionId: s2.versionId });
  try {
    await api.submission.create.mutate({ formVersionId: v1Id, data: { nameAbc1: "Late", colorXy2: "" } });
    check(false, "stale-version submission rejected");
  } catch (e) {
    check(code(e) === "CONFLICT", "stale-version submission rejected (CONFLICT)");
  }
  await api.submission.create.mutate({ formVersionId: s2.versionId, data: { nameAbc1: "Grace", colorXy2: "" } });

  // Fire simultaneous publishes of different versions; the partial unique index must reject the losers.
  let conflicts = 0;
  for (let round = 0; round < 10; round++) {
    const results = await Promise.allSettled([
      api.form.publish.mutate({ formId, versionId: v1Id }),
      api.form.publish.mutate({ formId, versionId: s3.versionId }),
    ]);
    conflicts += results.filter((r) => r.status === "rejected" && code(r.reason) === "CONFLICT").length;
    const others = results.filter((r) => r.status === "rejected" && code(r.reason) !== "CONFLICT");
    if (others.length) console.log("unexpected", others);
  }
  const live = (await api.form.listVersions.query({ formId })).filter((v) => v.published);
  check(live.length === 1, `exactly one live version after races (v${live[0]?.version})`);
  check(conflicts > 0, `simultaneous publish rejected with CONFLICT (${conflicts}/10 rounds)`);

  const subs = await api.submission.list.query({ formId });
  check(
    subs.versions.map((v) => `${v.version}:${v.submissions.length}`).join(",") === "2:1,1:1",
    "submissions grouped by version",
  );
  check(subs.versions[0].definition.fields[0].label === "Full name", "v2 submissions use v2 labels");

  await api.form.archive.mutate({ formId });
  check(!(await api.form.list.query()).some((f) => f.id === formId), "archived form hidden from list");
  check((await api.form.getPublished.query({ formId })) === null, "archived form can't be filled");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
