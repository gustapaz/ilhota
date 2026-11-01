import { test } from "node:test";
import assert from "node:assert/strict";
import { createApi } from "../server/api.mjs";
import { service } from "../server/service.mjs";
const api = createApi({});
const request = (path, body) =>
  api(
    new Request("https://demo.local" + path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
import { createTRPCClient, httpLink } from "@trpc/client";
const client = createTRPCClient({
  links: [
    httpLink({
      url: "https://demo.local/api/trpc",
      fetch: (input, init) => api(new Request(input, init)),
    }),
  ],
});
test("native tRPC client receives the actual terrain and A* path", async () => {
  assert.deepEqual(
    await client.generate.mutate(service.meta.default_input),
    service.compute(service.meta.default_input),
  );
});
test("tRPC input validation rejects an out-of-map point", async () => {
  await assert.rejects(() =>
    client.generate.mutate({ ...service.meta.default_input, from: 576 }),
  );
});
test(
  "oversized native requests terminate with 413, including cloned bodies",
  { timeout: 2000 },
  async () => {
    const r = await api(
      new Request("https://demo.local/api/trpc/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "x".repeat(17000),
      }),
    );
    assert.equal(r.status, 413);
  },
);
