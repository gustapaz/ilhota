import { test } from "node:test";
import assert from "node:assert/strict";
import { service } from "../server/service.mjs";

import { search } from "../server/service.mjs";
test("same seed and settings give byte-equivalent terrain", () => {
  const p = service.meta.default_input;
  assert.deepEqual(service.compute(p), service.compute(p));
  assert.notDeepEqual(
    service.compute(p).heights,
    service.compute({ ...p, seed: p.seed + 1 }).heights,
  );
});
test("terrain dimensions and heights are finite and bounded", () => {
  for (const p of service.meta.presets) {
    const r = service.compute(p.input);
    assert.equal(r.heights.length, 576);
    assert.ok(r.heights.every((v) => Number.isFinite(v) && v >= 0 && v <= 1));
    assert.ok(r.land_percent >= 0 && r.land_percent <= 100);
  }
});
test("flat-map A* cost matches independent Manhattan distance", () => {
  const r = search(Array(576).fill(1), 0.3, 0, 575);
  assert.equal(r.found, true);
  assert.equal(r.cost, 46);
  assert.equal(r.path.length, 47);
});
test("route never crosses water or diagonal gaps", () => {
  const r = service.compute(service.meta.default_input);
  assert.equal(r.route.found, true);
  for (let i = 0; i < r.route.path.length; i++) {
    const id = r.route.path[i];
    assert.ok(r.heights[id] > r.sea);
    if (i) {
      const a = r.route.path[i - 1];
      assert.equal(
        Math.abs((a % 24) - (id % 24)) +
          Math.abs(Math.floor(a / 24) - Math.floor(id / 24)),
        1,
      );
    }
  }
});
test("submerged endpoint fails honestly and OBJ has valid vertex/face counts", () => {
  assert.equal(search(Array(576).fill(0), 0.3, 0, 575).found, false);
  const lines = service.export(service.meta.default_input).text.split("\n");
  assert.equal(lines.filter((x) => x.startsWith("v ")).length, 576);
  assert.equal(lines.filter((x) => x.startsWith("f ")).length, 1058);
  for (const f of lines.filter((x) => x.startsWith("f ")))
    assert.ok(
      f
        .slice(2)
        .split(" ")
        .map(Number)
        .every((v) => v >= 1 && v <= 576),
    );
});
test("seed endpoint water and extra constraints enforced", () => {
  for (const x of [
    { seed: 0 },
    { from: 576 },
    { sea: 0.8 },
    { roughness: -1 },
    { extra: 1 },
  ])
    assert.throws(() =>
      service.compute({ ...service.meta.default_input, ...x }),
    );
});
