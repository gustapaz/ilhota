import { validateInput } from "./validator.mjs";
export const meta = {
  slug: "ilhota",
  title: "ILHOTA",
  engine: "trpc-zod-terrain-astar",
  default_input: { seed: 231, sea: 0.25, roughness: 0.45, from: 200, to: 375 },
  presets: [
    {
      name: "O primeiro mundo",
      input: { seed: 231, sea: 0.25, roughness: 0.45, from: 200, to: 375 },
    },
    {
      name: "Costa baixa",
      input: { seed: 842, sea: 0.38, roughness: 0.65, from: 200, to: 375 },
    },
    {
      name: "O relevo suave",
      input: { seed: 128, sea: 0.2, roughness: 0.1, from: 175, to: 400 },
    },
  ],
  note: "Terreno procedural sintético de 24×24 amostras. Não é mapa geográfico, previsão, navegação ou relevo de uma ilha real. Trilha A* em quatro vizinhos sobre terra firme.",
};
export const validate = validateInput;
const smooth = (t) => t * t * (3 - 2 * t),
  lerp = (a, b, t) => a + (b - a) * t;
function random(seed, x, y) {
  let v = Math.imul(
    seed ^ Math.imul(x + 100, 374761393) ^ Math.imul(y + 100, 668265263),
    1274126177,
  );
  v ^= v >>> 13;
  return (v >>> 0) / 4294967295;
}
export function noise(seed, x, y) {
  const ix = Math.floor(x),
    iy = Math.floor(y),
    tx = smooth(x - ix),
    ty = smooth(y - iy);
  return lerp(
    lerp(random(seed, ix, iy), random(seed, ix + 1, iy), tx),
    lerp(random(seed, ix, iy + 1), random(seed, ix + 1, iy + 1), tx),
    ty,
  );
}
export function terrain(p) {
  return Array.from({ length: 576 }, (_, i) => {
    const x = i % 24,
      y = Math.floor(i / 24),
      r = Math.hypot((x - 11.5) / 12, (y - 11.5) / 12),
      n =
        noise(p.seed, x / 5, y / 5) * 0.65 +
        noise(p.seed + 13, x / 2.5, y / 2.5) * 0.25 +
        noise(p.seed + 97, x, y) * 0.1;
    return Math.max(
      0,
      Math.min(1, 0.65 * (1 - r * r) + (n - 0.5) * p.roughness * 0.5),
    );
  });
}
export function search(heights, sea, from, to) {
  if (heights[from] <= sea || heights[to] <= sea)
    return {
      found: false,
      path: [],
      reason: "Um dos pontos está submerso. Escolha uma célula de terra.",
      visited: 0,
    };
  const open = new Set([from]),
    cost = new Map([[from, 0]]),
    parent = new Map(),
    heuristic = (i) =>
      Math.abs((i % 24) - (to % 24)) +
      Math.abs(Math.floor(i / 24) - Math.floor(to / 24));
  let visited = 0;
  while (open.size) {
    const current = [...open].sort(
      (a, b) =>
        cost.get(a) + heuristic(a) - (cost.get(b) + heuristic(b)) || a - b,
    )[0];
    open.delete(current);
    visited++;
    if (current === to) {
      const path = [to];
      while (parent.has(path[0])) path.unshift(parent.get(path[0]));
      return { found: true, path, cost: cost.get(to), visited };
    }
    const x = current % 24,
      y = Math.floor(current / 24),
      neighbors = [
        ...(x ? [current - 1] : []),
        ...(x < 23 ? [current + 1] : []),
        ...(y ? [current - 24] : []),
        ...(y < 23 ? [current + 24] : []),
      ];
    for (const next of neighbors) {
      if (heights[next] <= sea) continue;
      const candidate =
        cost.get(current) + 1 + Math.abs(heights[next] - heights[current]) * 6;
      if (candidate < (cost.get(next) ?? Infinity)) {
        cost.set(next, candidate);
        parent.set(next, current);
        open.add(next);
      }
    }
  }
  return {
    found: false,
    path: [],
    reason: "A água separa os pontos. Não há trilha terrestre.",
    visited,
  };
}
export function compute(raw) {
  const p = validate(raw),
    heights = terrain(p),
    land = heights.map((v) => v > p.sea),
    seen = new Set();
  let islands = 0;
  for (let i = 0; i < 576; i++)
    if (land[i] && !seen.has(i)) {
      islands++;
      const queue = [i];
      seen.add(i);
      for (let k = 0; k < queue.length; k++) {
        const c = queue[k],
          x = c % 24,
          y = Math.floor(c / 24);
        for (const n of [
          ...(x ? [c - 1] : []),
          ...(x < 23 ? [c + 1] : []),
          ...(y ? [c - 24] : []),
          ...(y < 23 ? [c + 24] : []),
        ])
          if (land[n] && !seen.has(n)) {
            seen.add(n);
            queue.push(n);
          }
      }
    }
  return {
    size: 24,
    heights,
    sea: p.sea,
    seed: p.seed,
    land_percent: (land.filter(Boolean).length / 576) * 100,
    islands,
    route: search(heights, p.sea, p.from, p.to),
    from: p.from,
    to: p.to,
    units: "synthetic scene units",
  };
}
export function exportResult(input) {
  const r = compute(input),
    vertices = r.heights.map(
      (h, i) => `v ${i % 24} ${(h * 6).toFixed(6)} ${Math.floor(i / 24)}`,
    ),
    faces = [];
  for (let y = 0; y < 23; y++)
    for (let x = 0; x < 23; x++) {
      const a = y * 24 + x + 1,
        b = a + 1,
        c = a + 24,
        d = c + 1;
      faces.push(`f ${a} ${c} ${b}`, `f ${b} ${c} ${d}`);
    }
  return {
    type: "text/plain; charset=utf-8",
    extension: "obj",
    text:
      "# ILHOTA · procedural synthetic terrain\n# 576 vertices, 1058 triangles; sea plane not included\n" +
      vertices.join("\n") +
      "\n" +
      faces.join("\n") +
      "\n",
  };
}
export const service = { meta, validate, compute, export: exportResult };
