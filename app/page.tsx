import ClientBoot from "./client-boot";
export default function Home() {
  return (
    <>
      <a className="skip" href="#app-root">
        Ir aos parâmetros da ilha
      </a>
      <header>
        <a className="brand" href="/">
          ilhota<span>ATLAS DO QUE PODERIA EXISTIR</span>
        </a>
        <a href="/api-docs.html">O relevo por trás ↗</a>
      </header>
      <main>
        <section className="world-area">
          <span className="coordinates">24° SINTÉTICOS / 24° POSSÍVEIS</span>
          <canvas
            id="world"
            tabIndex={0}
            role="img"
            aria-label="Terreno sintético tridimensional. Arraste para orbitar ou use as setas esquerda e direita. Caminho descrito no caderno."
          />
          <div className="world-controls">
            <span>ARRASTE PARA EXPLORAR</span>
            <button id="orbit-left" aria-label="Girar câmera para esquerda">
              ←
            </button>
            <button id="orbit-reset">Vista inicial</button>
            <button id="orbit-right" aria-label="Girar câmera para direita">
              →
            </button>
          </div>
          <p id="webgl-note" role="status"></p>
          <figure>
            <img
              src="/media/subject.webp"
              width="1200"
              height="800"
              loading="lazy"
              alt="Costa real fotografada, inspiração para um terreno imaginado"
            />
            <figcaption>
              O real inspira.
              <br />A semente inventa.
            </figcaption>
          </figure>
        </section>
        <section id="app-root">Abrindo o atlas…</section>
      </main>
      <footer>
        <span>Uma experiência de Gustavo Paz</span>
        <a href="/credits.html">Créditos ↗</a>
        <a href="https://github.com/gustapaz/ilhota">Código ↗</a>
        <button id="motion-toggle" aria-pressed="false">
          Pausar movimento
        </button>
      </footer>
      <ClientBoot />
    </>
  );
}
