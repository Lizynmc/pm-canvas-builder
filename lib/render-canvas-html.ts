import { BLOCK_DEFINITIONS, type CanvasBlock, type CanvasModel } from "./canvas-schema";
import { GSAP_SOURCE } from "./gsap-inline";
import { escapeHtml } from "./html-escape";
import { getPalette } from "./palettes";

function renderGroups(block: CanvasBlock): string {
  return block.groups
    .map((group) => {
      const items = group.items.filter((item) => item.text.trim());
      if (items.length === 0) return "";
      const label = group.label?.trim()
        ? `<p class="sub">${escapeHtml(group.label)}</p>`
        : "";
      const lis = items
        .map(
          (item) =>
            `<li${item.pending ? ' class="open"' : ""}>${escapeHtml(item.text)}</li>`,
        )
        .join("");
      return `${label}<ul>${lis}</ul>`;
    })
    .filter(Boolean)
    .join("\n");
}

function renderDetail(block: CanvasBlock): string {
  if (!block.detail || block.detail.length === 0) return "";
  return block.detail
    .map((section) => {
      const entries = section.entries.filter((entry) => entry.text.trim());
      if (!section.heading.trim() && entries.length === 0) return "";
      const intro = section.intro?.trim()
        ? `<p class="detail-note">${escapeHtml(section.intro)}</p>`
        : "";
      const lis = entries
        .map((entry) => {
          const label = entry.label?.trim()
            ? `<strong>${escapeHtml(entry.label)}</strong> — `
            : "";
          const note = entry.note?.trim()
            ? ` <em class="detail-note">${escapeHtml(entry.note)}</em>`
            : "";
          return `<li>${label}${escapeHtml(entry.text)}${note}</li>`;
        })
        .join("");
      return `<h3>${escapeHtml(section.heading)}</h3>${intro}<ul class="detail-list">${lis}</ul>`;
    })
    .filter(Boolean)
    .join("\n");
}

function renderBlockSection(def: (typeof BLOCK_DEFINITIONS)[number], block: CanvasBlock): string {
  const subtitle = def.fixedSubtitle ?? (block.subtitle?.trim() || "");
  const small = subtitle ? ` <small>${escapeHtml(subtitle)}</small>` : "";
  const groupsHtml = renderGroups(block);
  const detailHtml = renderDetail(block);
  const hasDetail = detailHtml.trim().length > 0;

  return `
    <section class="block b-${def.id}">
      <header>
        <svg class="ico" viewBox="0 0 24 24">${def.icon}</svg>
        <h2>${escapeHtml(def.title)}${small}</h2>
      </header>
      <div class="block-summary">
        ${groupsHtml}
      </div>${hasDetail ? `\n      <div class="block-detail">${detailHtml}</div>` : ""}
    </section>`;
}

function gridPositionCss(): string {
  return BLOCK_DEFINITIONS.map(
    (def) =>
      `.b-${def.id} { grid-column: ${def.gridColumn}; grid-row: ${def.gridRow}; }`,
  ).join("\n  ");
}

function faviconHref(accent: string): string {
  const fill = encodeURIComponent(accent);
  return `data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='${fill}'%3E%3Cellipse%20cx='12'%20cy='16.6'%20rx='5.7'%20ry='4.7'/%3E%3Cellipse%20cx='4.9'%20cy='9.6'%20rx='2.7'%20ry='3.2'/%3E%3Cellipse%20cx='9.8'%20cy='5.4'%20rx='2.6'%20ry='3.4'/%3E%3Cellipse%20cx='15.3'%20cy='5.6'%20rx='2.6'%20ry='3.4'/%3E%3Cellipse%20cx='19.6'%20cy='10'%20rx='2.7'%20ry='3.2'/%3E%3C/svg%3E`;
}

const INTERACTION_SCRIPT = `
(function () {
  var body = document.body;
  var toggle = document.getElementById("slideToggle");
  var closeBtn = document.getElementById("slideClose");
  var sheet = document.getElementById("sheet");
  var backdrop = document.querySelector(".backdrop");
  var SLIDE_W = 1280;
  var SLIDE_H = 720;

  var semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)");
  function d(seg) { return semMovimento.matches ? 0 : seg; }

  function escalaSlide() {
    return Math.min(window.innerWidth / SLIDE_W, window.innerHeight / SLIDE_H) * 0.97;
  }

  function fitSlide() {
    if (!body.classList.contains("slide-mode")) return;
    gsap.set(sheet, { scale: escalaSlide() });
  }

  function enterSlide() {
    body.classList.add("slide-mode");
    var s = escalaSlide();

    gsap.fromTo(backdrop, { opacity: 0 }, { opacity: 1, duration: d(0.35), ease: "power2.out" });

    gsap.fromTo(sheet,
      { xPercent: -50, yPercent: -46, scale: s * 0.9, opacity: 0 },
      { xPercent: -50, yPercent: -50, scale: s, opacity: 1, duration: d(0.55), ease: "power3.out" }
    );

    gsap.from(sheet.querySelectorAll(".block"), {
      opacity: 0,
      y: 14,
      duration: d(0.4),
      ease: "power2.out",
      stagger: 0.025,
      delay: d(0.15),
      clearProps: "opacity,transform"
    });

    var el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(function () {});
    }
  }

  function limparSlide() {
    gsap.set(sheet, { clearProps: "all" });
    gsap.to(backdrop, {
      opacity: 0,
      duration: d(0.3),
      onComplete: function () { gsap.set(backdrop, { clearProps: "opacity" }); }
    });
  }

  function exitSlide() {
    if (!body.classList.contains("slide-mode")) return;
    body.classList.remove("slide-mode");
    limparSlide();
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(function () {});
    }
  }

  toggle.addEventListener("click", function () {
    if (body.classList.contains("slide-mode")) {
      exitSlide();
    } else {
      enterSlide();
    }
  });

  closeBtn.addEventListener("click", exitSlide);

  document.addEventListener("fullscreenchange", function () {
    if (!document.fullscreenElement) {
      if (body.classList.contains("slide-mode")) {
        body.classList.remove("slide-mode");
        limparSlide();
      }
    } else {
      fitSlide();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (
      e.key === "Escape" &&
      body.classList.contains("slide-mode") &&
      !document.querySelector(".zoom-overlay")
    ) {
      exitSlide();
    }
  });

  window.addEventListener("resize", fitSlide);

  function openZoom(block) {
    var ov = document.createElement("div");
    ov.className = "zoom-overlay";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");

    var card = block.cloneNode(true);
    card.className = "zoom-card";
    if (card.querySelector(".block-detail")) {
      card.classList.add("zoom-card--wide");
    }

    var x = document.createElement("button");
    x.className = "zoom-x";
    x.setAttribute("aria-label", "Fechar seção ampliada");
    x.title = "Fechar (Esc)";
    x.textContent = "\\u2715";
    card.appendChild(x);

    ov.appendChild(card);
    document.body.appendChild(ov);

    function origem() {
      var b = block.getBoundingClientRect();
      var c = card.getBoundingClientRect();
      return {
        x: (b.left + b.width / 2) - (c.left + c.width / 2),
        y: (b.top + b.height / 2) - (c.top + c.height / 2),
        scale: Math.max(b.width / c.width, 0.3),
        opacity: 0
      };
    }

    if (semMovimento.matches) {
      gsap.set(ov, { opacity: 1 });
    } else {
      gsap.to(ov, { opacity: 1, duration: 0.28, ease: "power2.out" });
      gsap.from(card, Object.assign(origem(), { duration: 0.5, ease: "power3.out" }));
    }

    function close() {
      document.removeEventListener("keydown", onKey);
      if (semMovimento.matches) { ov.remove(); return; }
      gsap.to(ov, { opacity: 0, duration: 0.3, ease: "power2.in" });
      gsap.to(card, Object.assign(origem(), {
        duration: 0.3,
        ease: "power2.in",
        onComplete: function () { ov.remove(); }
      }));
    }
    function onKey(e) {
      if (e.key === "Escape") close();
    }
    x.addEventListener("click", close);
    ov.addEventListener("click", function (e) {
      if (e.target === ov) close();
    });
    document.addEventListener("keydown", onKey);
  }

  var headers = document.querySelectorAll(".block > header");
  for (var i = 0; i < headers.length; i++) {
    (function (h) {
      h.title = "Ampliar seção";
      h.addEventListener("click", function () {
        openZoom(h.parentElement);
      });
    })(headers[i]);
  }
})();
`;

export function renderCanvasHtml(model: CanvasModel): string {
  const palette = getPalette(model.paletteId);
  const title = escapeHtml(model.projectName || "PM Canvas");
  const sheetLabel = escapeHtml(
    `Project Model Canvas do projeto ${model.projectName || "sem nome"}`,
  );
  const footerMeta = escapeHtml(model.footerMeta);

  const blocksHtml = BLOCK_DEFINITIONS.map((def) =>
    renderBlockSection(def, model.blocks[def.id]),
  ).join("\n");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<link rel="icon" href="${faviconHref(palette.accent)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --ink: ${palette.ink};
    --accent: ${palette.accent};
    --accent-dark: ${palette.accentDark};
    --accent-bg: ${palette.accentBg};
    --paper: ${palette.paper};
    --muted: ${palette.muted};
    --line: ${palette.line};
    --page-bg: ${palette.pageBg};
    --footer-text: ${palette.footerText};
    --backdrop: ${palette.backdrop};
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Poppins", sans-serif;
    background: var(--page-bg);
    color: var(--ink);
    padding: 24px;
    display: flex;
    justify-content: center;
  }
  .sheet {
    background: var(--paper);
    border: 2px solid var(--ink);
    border-radius: 6px;
    width: 100%;
    max-width: 1280px;
    overflow: hidden;
    box-shadow: 0 8px 30px rgba(26, 21, 24, 0.10);
    display: flex;
    flex-direction: column;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-template-rows: repeat(6, minmax(96px, auto));
    background: var(--line);
    gap: 1px;
    flex: 1;
  }
  .block { background: var(--paper); padding: 12px 14px; display: flex; flex-direction: column; }
  ${gridPositionCss()}
  .block header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  .block header svg.ico {
    width: 18px;
    height: 18px;
    stroke: var(--accent-dark);
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    flex-shrink: 0;
  }
  .block h2 {
    font-size: 11.5px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    line-height: 1.25;
  }
  .block h2 small {
    display: block;
    font-size: 9.5px;
    font-weight: 500;
    letter-spacing: 0.04em;
    text-transform: none;
    color: var(--muted);
  }
  .block ul { list-style: none; }
  .block li {
    font-size: 11.5px;
    line-height: 1.5;
    color: var(--ink);
    padding-left: 12px;
    position: relative;
    margin-bottom: 6px;
  }
  .block li::before {
    content: "";
    position: absolute;
    left: 0;
    top: 7px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--accent);
  }
  .block li.open {
    background: var(--accent-bg);
    border-radius: 6px;
    padding: 4px 8px 4px 20px;
    color: var(--accent-dark);
    font-weight: 500;
  }
  .block li.open::before { left: 8px; top: 11px; background: var(--accent-dark); }
  .sub {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted);
    margin: 8px 0 4px;
  }
  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 2px solid var(--ink);
    padding: 10px 16px;
    background: var(--ink);
    color: var(--paper);
  }
  .footer .brand {
    font-family: inherit;
    font-weight: 700;
    font-size: 14px;
    color: var(--paper);
    background: none;
    border: none;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 2px 4px;
    border-radius: 4px;
    transition: color 0.2s ease;
  }
  .footer .brand svg {
    width: 14px;
    height: 14px;
    stroke: var(--footer-text);
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    transition: transform 0.2s ease;
  }
  .footer .brand:hover { color: var(--footer-text); }
  .footer .brand:hover svg { transform: scale(1.15); }
  .footer .brand:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  .footer .meta { font-size: 10.5px; color: var(--footer-text); }
  .credit {
    max-width: 1280px;
    font-size: 9.5px;
    color: var(--muted);
    margin-top: 6px;
  }

  .backdrop {
    position: fixed;
    inset: 0;
    background: var(--backdrop);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.35s ease;
    z-index: 40;
  }
  body.slide-mode .backdrop { opacity: 1; pointer-events: auto; }
  body.slide-mode { overflow: hidden; }
  body.slide-mode .sheet {
    position: fixed;
    top: 50%;
    left: 50%;
    width: 1280px;
    height: 720px;
    max-width: none;
    z-index: 50;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.55);
  }
  body.slide-mode .grid {
    grid-template-rows: repeat(6, 1fr);
    overflow: hidden;
  }
  body.slide-mode .credit { display: none; }
  /* Conteúdo que não cabe no bloco em 1280x720 rola em vez de ser cortado. */
  body.slide-mode .block { overflow-y: auto; overflow-x: hidden; padding: 8px 12px; }
  body.slide-mode .block header { margin-bottom: 5px; }
  body.slide-mode .block header svg.ico { width: 15px; height: 15px; }
  body.slide-mode .block h2 { font-size: 10.5px; }
  body.slide-mode .block h2 small { font-size: 8.5px; }
  body.slide-mode .block li {
    font-size: 10.2px;
    line-height: 1.4;
    margin-bottom: 2px;
  }
  body.slide-mode .block li::before { top: 5px; width: 4px; height: 4px; }
  body.slide-mode .block li.open { padding: 3px 7px 3px 17px; }
  body.slide-mode .block li.open::before { left: 7px; top: 8px; }
  body.slide-mode .sub { font-size: 9px; margin: 5px 0 3px; }
  .slide-close {
    position: fixed;
    top: 18px;
    right: 22px;
    z-index: 60;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid var(--footer-text);
    background: color-mix(in srgb, var(--ink) 70%, transparent);
    color: var(--footer-text);
    font-size: 18px;
    font-family: inherit;
    cursor: pointer;
    display: none;
    align-items: center;
    justify-content: center;
    transition: background 0.2s ease, transform 0.2s ease;
  }
  .slide-close:hover { background: var(--accent-dark); transform: scale(1.08); }
  body.slide-mode .slide-close { display: flex; }

  .block > header {
    cursor: pointer;
    border-radius: 6px;
    transition: color 0.2s ease;
  }
  .block > header:hover h2 { color: var(--accent-dark); }
  .block > header:hover svg.ico { transform: scale(1.12); }
  .block > header svg.ico { transition: transform 0.2s ease; }
  .zoom-overlay {
    position: fixed;
    inset: 0;
    z-index: 80;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: color-mix(in srgb, var(--ink) 35%, transparent);
    -webkit-backdrop-filter: blur(7px);
    backdrop-filter: blur(7px);
    opacity: 0;
  }
  .zoom-card {
    position: relative;
    background: var(--paper);
    border: 2px solid var(--ink);
    border-radius: 12px;
    width: min(880px, 94vw);
    max-height: 88vh;
    overflow: auto;
    padding: 30px 36px;
    box-shadow: 0 30px 90px rgba(0, 0, 0, 0.45);
  }
  .zoom-card header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 20px;
    cursor: default;
  }
  .zoom-card header svg.ico {
    width: 32px;
    height: 32px;
    stroke: var(--accent-dark);
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
    flex-shrink: 0;
  }
  .zoom-card h2 {
    font-size: 24px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    line-height: 1.25;
  }
  .zoom-card h2 small {
    display: block;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.03em;
    text-transform: none;
    color: var(--muted);
  }
  .zoom-card ul { list-style: none; }
  .zoom-card li {
    font-size: 18px;
    line-height: 1.7;
    color: var(--ink);
    padding-left: 20px;
    position: relative;
    margin-bottom: 12px;
  }
  .zoom-card li::before {
    content: "";
    position: absolute;
    left: 0;
    top: 12px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent);
  }
  .zoom-card li.open {
    background: var(--accent-bg);
    border-radius: 8px;
    padding: 8px 14px 8px 30px;
    color: var(--accent-dark);
    font-weight: 500;
  }
  .zoom-card li.open::before { left: 13px; top: 20px; background: var(--accent-dark); }
  .zoom-card .sub { font-size: 14px; margin: 16px 0 8px; }
  .zoom-x {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: 2px solid var(--line);
    background: var(--paper);
    color: var(--muted);
    font-size: 15px;
    font-family: inherit;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s ease, color 0.2s ease;
  }
  .zoom-x:hover { background: var(--accent-bg); color: var(--accent-dark); border-color: var(--accent); }

  .block-detail { display: none; }
  .zoom-card.zoom-card--wide { width: min(980px, 96vw); }
  .zoom-card--wide .block-summary { display: none; }
  .zoom-card--wide .block-detail { display: block; }
  .zoom-card--wide .block-detail h3 {
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--accent-dark);
    margin: 26px 0 12px;
  }
  .zoom-card--wide .block-detail h3:first-child { margin-top: 0; }
  .zoom-card--wide .block-detail .detail-note {
    font-size: 14px;
    color: var(--muted);
    margin-bottom: 10px;
  }
  .zoom-card--wide .block-detail .detail-list li {
    font-size: 14.5px;
    line-height: 1.55;
    margin-bottom: 8px;
  }
  .zoom-card--wide .block-detail li strong { color: var(--accent-dark); }

  @media (prefers-reduced-motion: reduce) {
    .backdrop { transition: none; }
    .block > header svg.ico,
    .footer .brand,
    .footer .brand svg { transition: none; }
  }

  @media (max-width: 900px) {
    .grid { grid-template-columns: repeat(2, 1fr); grid-auto-rows: auto; }
    .grid .block { grid-column: auto; grid-row: auto; }
    .b-restricoes { grid-column: 1 / 3; }
  }
  @media print {
    body { background: var(--paper); padding: 0; }
    .sheet { box-shadow: none; max-width: none; border-radius: 0; }
    .backdrop, .slide-close { display: none !important; }
    @page { size: A4 landscape; margin: 8mm; }
  }
</style>
</head>
<body>
<div class="backdrop" aria-hidden="true"></div>
<button class="slide-close" id="slideClose" aria-label="Sair da tela cheia" title="Sair (Esc)">✕</button>
<div>
<main class="sheet" id="sheet" aria-label="${sheetLabel}">
  <div class="grid">
${blocksHtml}
  </div>

  <div class="footer">
    <button class="brand" id="slideToggle" title="Abrir em tela cheia (16:9)" aria-label="Abrir o canvas em tela cheia no formato 16:9">
      Project Model Canvas
      <svg viewBox="0 0 24 24"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
    </button>
    <span class="meta">${footerMeta}</span>
  </div>
</main>
<p class="credit">Modelo: Project Model Canvas, de José Finocchio Júnior. Itens destacados estão pendentes de decisão. Clique no título de uma seção para ampliá-la, ou no título do canvas (rodapé) para o modo slide 16:9.</p>
</div>

<script>${GSAP_SOURCE}</script>
<script>${INTERACTION_SCRIPT}</script>
</body>
</html>
`;
}
