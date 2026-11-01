import { html, render, signal } from "uhtml";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createTRPCClient, httpLink } from "@trpc/client";
import { model } from "./model";
import { motionToggle } from "./client";
const canvas = document.querySelector<HTMLCanvasElement>("#world")!,
  host = document.querySelector("#app-root")!;
let renderer: THREE.WebGLRenderer | undefined,
  controls: OrbitControls | undefined,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  world: THREE.Group,
  raf = 0,
  paused = matchMedia("(prefers-reduced-motion: reduce)").matches,
  visible = true,
  last: any,
  started = 0;
const client = createTRPCClient<any>({
  links: [httpLink({ url: "/api/trpc" })],
});
function resize() {
  if (!renderer) return;
  const rect = canvas.getBoundingClientRect();
  renderer.setSize(rect.width, rect.height, false);
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
  draw();
}
function draw() {
  if (!renderer || !visible || document.hidden) return;
  renderer.render(scene, camera);
}
function frame() {
  raf = 0;
  if (!renderer || paused || !visible || document.hidden) return;
  controls?.update();
  if (world && last) {
    const progress = Math.min(1, (performance.now() - started) / 1300);
    world.scale.y = 0.02 + 0.98 * (1 - Math.pow(1 - progress, 3));
  }
  draw();
  if (last && performance.now() - started < 1400)
    raf = requestAnimationFrame(frame);
}
function wake() {
  if (!raf && !paused && visible && !document.hidden)
    raf = requestAnimationFrame(frame);
  else if (paused && world) {
    world.scale.y = 1;
    draw();
  }
}
try {
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor("#c5ddda", 1);
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog("#c5ddda", 45, 90);
  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 150);
  camera.position.set(30, 27, 34);
  camera.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight("#fff4d7", "#376c66", 2.5));
  const sun = new THREE.DirectionalLight("#fff8e8", 3);
  sun.position.set(10, 30, 15);
  scene.add(sun);
  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.enablePan = false;
  controls.minDistance = 22;
  controls.maxDistance = 70;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.addEventListener("change", draw);
  resize();
} catch {
  document.querySelector("#webgl-note")!.textContent =
    "A visualização 3D não está disponível neste dispositivo. Os dados e a exportação continuam funcionando.";
}
function paint(r: any) {
  last = r;
  if (!renderer) return;
  if (world) {
    scene.remove(world);
    world.traverse((object: any) => {
      object.geometry?.dispose();
      if (object.material)
        for (const m of Array.isArray(object.material)
          ? object.material
          : [object.material])
          m.dispose();
    });
  }
  world = new THREE.Group();
  scene.add(world);
  if (!r) {
    draw();
    return;
  }
  const positions: number[] = [],
    colors: number[] = [],
    indices: number[] = [];
  r.heights.forEach((height: number, i: number) => {
    positions.push((i % 24) - 11.5, height * 7 - 2, Math.floor(i / 24) - 11.5);
    const color = new THREE.Color(
      height < r.sea
        ? "#6f9b92"
        : height < r.sea + 0.05
          ? "#dfcd9d"
          : height > 0.53
            ? "#799078"
            : "#a1b184",
    );
    colors.push(color.r, color.g, color.b);
  });
  for (let y = 0; y < 23; y++)
    for (let x = 0; x < 23; x++) {
      const i = y * 24 + x;
      indices.push(i, i + 24, i + 1, i + 1, i + 24, i + 25);
    }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  world.add(
    new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        flatShading: true,
        roughness: 1,
      }),
    ),
  );
  const sea = new THREE.Mesh(
    new THREE.BoxGeometry(29, 0.35, 29),
    new THREE.MeshStandardMaterial({
      color: "#75aaa7",
      transparent: true,
      opacity: 0.72,
      roughness: 0.4,
    }),
  );
  sea.position.y = r.sea * 7 - 2;
  world.add(sea);
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(23, 1.5, 23),
    new THREE.MeshStandardMaterial({ color: "#626d52", roughness: 1 }),
  );
  base.position.y = -2.8;
  world.add(base);
  if (r.route.path.length) {
    const line = new THREE.BufferGeometry().setFromPoints(
      r.route.path.map(
        (i: number) =>
          new THREE.Vector3(
            (i % 24) - 11.5,
            r.heights[i] * 7 - 1.85,
            Math.floor(i / 24) - 11.5,
          ),
      ),
    );
    world.add(
      new THREE.Line(line, new THREE.LineBasicMaterial({ color: "#b93820" })),
    );
  }
  for (const [i, color] of [
    [r.from, "#b93820"],
    [r.to, "#fcf0c6"],
  ] as const) {
    const marker = new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 1.2, 6),
      new THREE.MeshStandardMaterial({ color }),
    );
    marker.position.set(
      (i % 24) - 11.5,
      Math.max(r.heights[i], r.sea) * 7 - 1.1,
      Math.floor(i / 24) - 11.5,
    );
    world.add(marker);
  }
  started = performance.now();
  world.scale.y = paused ? 1 : 0.02;
  draw();
  wake();
}
const revision = signal(0);
const a = model(
    "ilhota",
    () => {
      revision.value++;
    },
    paint,
  ),
  d = a.d;
a.api.compute = (input) => (client as any).generate.mutate(input);
const button = (text: string, fn: () => any, disabled = false) =>
  html`<button ?disabled=${d.busy || disabled} onclick=${fn}>${text}</button>`;
const range = (
  key: string,
  label: string,
  min: number,
  max: number,
  step: number,
) =>
  html`<label
    >${label}<span>${d.input[key]}</span
    ><input
      aria-label=${label}
      type="range"
      min="0"
      max="9999"
      step="any"
      .min=${min}
      .max=${max}
      .step=${step}
      .value=${d.input[key]}
      ?disabled=${d.busy}
      oninput=${(e: Event) => a.change(key, +(e.target as HTMLInputElement).value)}
  /></label>`;
function App() {
  revision.value;
  return html`<div class="field-notes">
    <div class="note-head">
      <span>CADERNO DE CAMPO / MUNDO SINTÉTICO</span>
      <h1>Uma ilha.<br />Infinitos <em>caminhos.</em></h1>
    </div>
    ${
      d.catalog
        ? html`<div class="controls">
            <div class="parameters">
              ${range("seed", "Semente", 1, 9999, 1)}${range("sea", "Nível do mar", 0.1, 0.7, 0.01)}${range("roughness", "Rugosidade", 0, 1, 0.05)}
              <div class="endpoints">
                ${range("from", "Origem · célula", 0, 575, 1)}${range("to", "Destino · célula", 0, 575, 1)}
              </div>
              ${button("Gerar e traçar ↗", () => a.run())}
            </div>
            <div class="presets">
              ${d.catalog.presets.map((p: any) => button(p.name + " ↗", () => a.preset(p)))}
            </div>
          </div>`
        : button("Tentar abrir o mundo", () => a.init())
    }
    <p class="status" role="status">${d.error || d.status}</p>
    ${
      d.result
        ? [
            html`<div class="report">
              <div class="metrics">
                <p>
                  <strong
                    >${d.result.land_percent.toFixed(1)}<small>%</small></strong
                  >terra emersa
                </p>
                <p><strong>${d.result.islands}</strong>porções de terra</p>
                <p>
                  <strong>${d.result.route.path.length}</strong>células na
                  trilha
                </p>
              </div>
              <p class="route">
                ${d.result.route.found ? "Trilha encontrada. Custo " + d.result.route.cost.toFixed(2) + " · " + d.result.route.visited + " células visitadas." : d.result.route.reason}
              </p>
              <details>
                <summary>Coordenadas da trilha</summary>
                <p>
                  ${d.result.route.path.join(" → ") || "Nenhum caminho terrestre."}
                </p>
                <p>Índice = linha × 24 + coluna. Linhas e colunas de 0 a 23.</p>
              </details>
            </div>`,
          ]
        : []
    }
    <details class="archive">
      <summary>Guardar esta ilha</summary>
      <label
        >Nome da ilha<input
          aria-label="Nome da ilha"
          maxlength="48"
          .value=${d.title}
          oninput=${(e: Event) => a.title((e.target as HTMLInputElement).value)} /></label
      >${button(d.current && d.owns ? "Salvar alterações" : "Guardar ilha", () => a.save(), !d.result)}${d.current ? [html`<div>${button("Reler do banco", () => a.open(d.current.id))}${button("Exportar OBJ ↓", () => a.download())}${d.owns ? [button(d.current.published ? "Encerrar link" : "Criar link", () => a.share())] : []}${button("Nova ilha", () => a.fresh())}</div>`] : []}${d.link ? [html`<a href=${d.link} target="_blank" rel="noreferrer">Abrir ilha compartilhada ↗</a>`] : []}<small
        >Retenção de 7 dias. Modelo OBJ do terreno, sem plano do mar. Edição
        nesta aba.</small
      >${d.archive.map((x: any) => button(x.title + " ↗", () => a.open(x.id)))}
    </details>
    <p class="limit">
      Nenhuma ilha real foi mapeada. Alturas e caminhos são calculados no
      servidor a partir de uma semente.
    </p>
  </div>`;
}
document
  .querySelector("#orbit-left")!
  .addEventListener("click", () => orbit(-0.25));
document
  .querySelector("#orbit-right")!
  .addEventListener("click", () => orbit(0.25));
document.querySelector("#orbit-reset")!.addEventListener("click", () => {
  if (!renderer) return;
  camera.position.set(30, 27, 34);
  controls?.update();
  draw();
});
function orbit(angle: number) {
  if (!renderer) return;
  camera.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
  controls?.update();
  draw();
}
canvas.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    e.preventDefault();
    orbit(e.key === "ArrowLeft" ? -0.2 : 0.2);
  }
});
const observer = new IntersectionObserver((entries) => {
  visible = entries[0].isIntersecting;
  if (visible) {
    draw();
    wake();
  } else {
    cancelAnimationFrame(raf);
    raf = 0;
  }
});
observer.observe(canvas);
const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(canvas);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    cancelAnimationFrame(raf);
    raf = 0;
  } else {
    draw();
    wake();
  }
});
motionToggle((value) => {
  paused = value;
  cancelAnimationFrame(raf);
  raf = 0;
  if (paused && world) world.scale.y = 1;
  draw();
  wake();
});
window.addEventListener(
  "pagehide",
  () => {
    cancelAnimationFrame(raf);
    observer.disconnect();
    resizeObserver.disconnect();
    controls?.dispose();
    renderer?.dispose();
    world?.traverse((o: any) => {
      o.geometry?.dispose();
      o.material?.dispose();
    });
  },
  { once: true },
);
render(host, () => html`<${App} />`);
void a.init();
