import {
  BLOCK_DEFINITIONS,
  type CanvasBlock,
  type CanvasGroup,
  type CanvasItem,
  type CanvasModel,
} from "./canvas-schema";
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

// Modo editável: os itens viram <li> editáveis diretamente no canvas,
// incluindo os vazios (pra sempre sobrar um slot pra digitar), com botões de
// remover/marcar pendente/adicionar. Cada controle carrega os índices em
// data-* pra o script injetado saber o que avisar ao React via postMessage.
function renderEditableItem(
  blockId: string,
  groupIndex: number,
  item: CanvasItem,
  i: number,
): string {
  const pendingClass = item.pending ? " open" : "";
  const attrs = `data-block="${blockId}" data-group="${groupIndex}" data-item="${i}"`;
  return `<li class="li-edit${pendingClass}">
        <span class="item-text" contenteditable="true" data-role="item-text" data-placeholder="Adicionar item…" ${attrs}>${escapeHtml(item.text)}</span>
        <span class="item-controls">
          <button type="button" data-action="toggle-pending" ${attrs} aria-pressed="${item.pending ? "true" : "false"}" title="Marcar/desmarcar como pendente">●</button>
          <button type="button" data-action="remove-item" ${attrs} title="Remover item">✕</button>
        </span>
      </li>`;
}

// Uma lista editável. `groups[0]` é a lista principal do bloco (sem título);
// de `groups[1]` em diante são as sublistas, que ganham um título editável e
// um botão pra remover a sublista inteira.
function renderEditableGroup(
  blockId: string,
  group: CanvasGroup,
  groupIndex: number,
): string {
  const items = group.items.length > 0 ? group.items : [{ text: "" }];
  const label =
    groupIndex === 0
      ? ""
      : `<div class="sub-edit">
        <span class="sub" contenteditable="true" data-role="group-label" data-placeholder="Título da sublista…" data-block="${blockId}" data-group="${groupIndex}">${escapeHtml(group.label ?? "")}</span>
        <button type="button" class="sub-remove" data-action="remove-group" data-block="${blockId}" data-group="${groupIndex}" title="Remover sublista">✕</button>
      </div>`;
  const lis = items
    .map((item, i) => renderEditableItem(blockId, groupIndex, item, i))
    .join("");
  return `${label}<ul>${lis}</ul><button type="button" class="add-item-btn" data-action="add-item" data-block="${blockId}" data-group="${groupIndex}">+ item</button>`;
}

// Modo simples (advanced=false): só a lista principal é editável; as sublistas
// que já existirem no rascunho continuam aparecendo, só leitura — exatamente o
// comportamento anterior. Modo completo (advanced=true): todas as listas são
// editáveis e dá pra criar sublistas novas.
function renderEditableGroups(
  blockId: string,
  block: CanvasBlock,
  advanced: boolean,
): string {
  const groups =
    block.groups.length > 0 ? block.groups : [{ items: [{ text: "" }] }];
  if (!advanced) {
    const readOnlyRest = renderGroups({ ...block, groups: groups.slice(1) });
    return `${renderEditableGroup(blockId, groups[0], 0)}\n${readOnlyRest}`;
  }
  const all = groups
    .map((group, i) => renderEditableGroup(blockId, group, i))
    .join("\n");
  return `${all}
      <button type="button" class="add-group-btn" data-action="add-group" data-block="${blockId}">+ sublista</button>`;
}

// Detalhamento editável (só no modo completo). Ele vive inteiro dentro da
// seção ampliada — no card do grid `.block-detail` fica escondido, e é assim
// que tem que ser: o canvas continua enxuto e o texto longo mora no "modo de
// visualização". A legenda no topo avisa isso, porque senão a pessoa escreve
// ali e estranha não ver nada no canvas.
function renderEditableDetail(blockId: string, block: CanvasBlock): string {
  const sections = block.detail ?? [];
  const sectionsHtml = sections
    .map((section, s) => {
      const entries =
        section.entries.length > 0 ? section.entries : [{ text: "" }];
      const lis = entries
        .map((entry, e) => {
          const attrs = `data-block="${blockId}" data-section="${s}" data-entry="${e}"`;
          return `<li class="detail-edit">
            <span class="detail-fields">
              <strong contenteditable="true" data-role="detail-entry-label" ${attrs}>${escapeHtml(entry.label ?? "")}</strong>
              <span contenteditable="true" data-role="detail-entry-text" data-placeholder="Texto da entrada…" ${attrs}>${escapeHtml(entry.text)}</span>
              <em class="detail-note" contenteditable="true" data-role="detail-entry-note" data-placeholder="Observação (opcional)" ${attrs}>${escapeHtml(entry.note ?? "")}</em>
            </span>
            <button type="button" class="detail-remove" data-action="remove-detail-entry" ${attrs} title="Remover entrada">✕</button>
          </li>`;
        })
        .join("");
      const sectionAttrs = `data-block="${blockId}" data-section="${s}"`;
      return `<div class="detail-section-edit">
          <div class="detail-head">
            <h3 contenteditable="true" data-role="detail-heading" data-placeholder="Título do detalhamento…" ${sectionAttrs}>${escapeHtml(section.heading)}</h3>
            <button type="button" class="detail-remove" data-action="remove-detail-section" ${sectionAttrs} title="Remover seção do detalhamento">✕</button>
          </div>
          <p class="detail-note" contenteditable="true" data-role="detail-intro" data-placeholder="Introdução (opcional)…" ${sectionAttrs}>${escapeHtml(section.intro ?? "")}</p>
          <ul class="detail-list">${lis}</ul>
          <button type="button" class="add-item-btn" data-action="add-detail-entry" ${sectionAttrs}>+ entrada</button>
        </div>`;
    })
    .join("\n");
  return `<div class="detail-legend">
          <span class="detail-legend-title">Detalhamento</span>
          <span class="detail-legend-tag">aparece só aqui, na seção ampliada — não no canvas</span>
        </div>
        ${sectionsHtml}
        <button type="button" class="add-group-btn" data-action="add-detail-section" data-block="${blockId}">+ seção de detalhamento</button>`;
}

// Aba de texto corrido (hoje só em Requisitos). Fica escondida no card do
// grid e só é alcançável pela seção ampliada, onde o script monta as abas —
// é o lugar de colar a lista inteira, do tamanho que for, sem inchar o canvas.
function renderFullText(
  def: (typeof BLOCK_DEFINITIONS)[number],
  block: CanvasBlock,
  editable: boolean,
): string {
  if (!def.fullTextTab) return "";
  const text = block.fullText ?? "";
  if (!editable && !text.trim()) return "";
  const body = editable
    ? `<div class="full-text-body" contenteditable="true" data-role="full-text" data-placeholder="Cole aqui o texto completo — pode ser do tamanho que precisar." data-block="${def.id}">${escapeHtml(text)}</div>`
    : `<div class="full-text-body">${escapeHtml(text)}</div>`;
  return `<div class="block-full-text" data-tab-label="${escapeHtml(def.fullTextTab)}">${body}</div>`;
}

function renderBlockSection(
  def: (typeof BLOCK_DEFINITIONS)[number],
  block: CanvasBlock,
  editable: boolean,
  advanced: boolean,
): string {
  const fixedSubtitle = def.fixedSubtitle;
  const subtitle = fixedSubtitle ?? (block.subtitle?.trim() || "");
  const small = fixedSubtitle
    ? ` <small>${escapeHtml(fixedSubtitle)}</small>`
    : editable
      ? ` <small contenteditable="true" data-role="subtitle-text" data-placeholder="Adicionar subtítulo…" data-block="${def.id}">${escapeHtml(subtitle)}</small>`
      : subtitle
        ? ` <small>${escapeHtml(subtitle)}</small>`
        : "";
  const groupsHtml = editable
    ? renderEditableGroups(def.id, block, advanced)
    : renderGroups(block);

  // No modo completo o detalhamento é sempre renderizado (mesmo vazio), senão
  // não haveria onde clicar pra criar a primeira seção.
  const detailHtml = editable && advanced
    ? renderEditableDetail(def.id, block)
    : renderDetail(block);
  const hasDetail = detailHtml.trim().length > 0;

  const fullTextHtml = renderFullText(def, block, editable);
  // Atalho pra aba de texto corrido: sem ele, não haveria como descobrir que
  // ela existe. Fica só no bloco que tem a aba, e só no modo editável.
  const fullTextBtn =
    editable && def.fullTextTab
      ? `\n        <button type="button" class="full-text-btn" data-action="open-full-text" data-block="${def.id}">+ texto completo</button>`
      : "";

  return `
    <section class="block b-${def.id}"${editable ? ` data-block-id="${def.id}"` : ""}>
      <header>
        <svg class="ico" viewBox="0 0 24 24">${def.icon}</svg>
        <h2>${escapeHtml(def.title)}${small}</h2>
      </header>
      <div class="block-summary">
        ${groupsHtml}${fullTextBtn}
      </div>${hasDetail ? `\n      <div class="block-detail">${detailHtml}</div>` : ""}${fullTextHtml ? `\n      ${fullTextHtml}` : ""}
    </section>`;
}

function gridPositionCss(): string {
  return BLOCK_DEFINITIONS.map(
    (def) =>
      `.b-${def.id} { grid-column: ${def.gridColumn}; grid-row: ${def.gridRow}; }`,
  ).join("\n  ");
}

// Ícone `layout-dashboard` do lucide (os mesmos quatro retângulos do grid do
// canvas), preenchido com o accent da paleta.
const FAVICON_SHAPE =
  "%3Crect%20x='3'%20y='3'%20width='7'%20height='9'%20rx='1.5'/%3E%3Crect%20x='14'%20y='3'%20width='7'%20height='5'%20rx='1.5'/%3E%3Crect%20x='14'%20y='12'%20width='7'%20height='9'%20rx='1.5'/%3E%3Crect%20x='3'%20y='16'%20width='7'%20height='5'%20rx='1.5'/%3E";

function faviconHref(accent: string): string {
  const fill = encodeURIComponent(accent);
  return `data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2024%2024'%20fill='${fill}'%3E${FAVICON_SHAPE}%3C/svg%3E`;
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

  // Só no modo editável (window.__pmcEditable): avisa o app React qual bloco
  // está ampliado, pra ele reabrir o mesmo zoom depois de recarregar o iframe
  // — senão editar o detalhamento fecharia a ampliação a cada ação.
  function postZoom(type, block) {
    if (!window.__pmcEditable) return;
    window.parent.postMessage({
      source: "pmc-canvas",
      type: type,
      blockId: block ? block.dataset.blockId : null
    }, "*");
  }

  function openZoom(block, instantaneo) {
    if (document.querySelector(".zoom-overlay")) return;
    var ov = document.createElement("div");
    ov.className = "zoom-overlay";
    ov.setAttribute("role", "dialog");
    ov.setAttribute("aria-modal", "true");

    var card = block.cloneNode(true);
    card.className = "zoom-card";
    if (card.querySelector(".block-detail")) {
      card.classList.add("zoom-card--wide");
    }

    // Bloco com texto corrido (hoje só Requisitos) ganha abas: o conteúdo do
    // canvas de um lado, o texto inteiro do outro. O card é um clone, então as
    // abas são montadas aqui, depois de clonar.
    var full = card.querySelector(".block-full-text");
    if (full) {
      var tabs = document.createElement("div");
      tabs.className = "zoom-tabs";
      var titulo = card.querySelector("h2");
      var nomes = [
        titulo ? titulo.childNodes[0].textContent.trim() : "Bloco",
        full.dataset.tabLabel || "Texto completo"
      ];
      for (var t = 0; t < nomes.length; t++) {
        (function (indice) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "zoom-tab";
          b.textContent = nomes[indice];
          b.setAttribute("aria-selected", indice === 0 ? "true" : "false");
          b.addEventListener("click", function () {
            card.classList.toggle("show-full-text", indice === 1);
            var todos = tabs.querySelectorAll(".zoom-tab");
            for (var k = 0; k < todos.length; k++) {
              todos[k].setAttribute("aria-selected", k === indice ? "true" : "false");
            }
          });
          tabs.appendChild(b);
        })(t);
      }
      card.insertBefore(tabs, card.querySelector("header").nextSibling);
      if (window.__pmcAutoTab === "full-text") {
        tabs.querySelectorAll(".zoom-tab")[1].click();
      }
    }
    window.__pmcAutoTab = null;

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

    postZoom("zoom-open", block);

    if (semMovimento.matches || instantaneo) {
      gsap.set(ov, { opacity: 1 });
    } else {
      gsap.to(ov, { opacity: 1, duration: 0.28, ease: "power2.out" });
      gsap.from(card, Object.assign(origem(), { duration: 0.5, ease: "power3.out" }));
    }

    function close() {
      document.removeEventListener("keydown", onKey);
      postZoom("zoom-close", null);
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
      h.addEventListener("click", function (e) {
        // Em modo editável, clicar num campo de texto (o subtítulo, dentro
        // do header) não deve também abrir o zoom da seção.
        if (e.target.closest && e.target.closest("[contenteditable]")) return;
        openZoom(h.parentElement);
      });
    })(headers[i]);
  }

  // Exposto pro EDITABLE_SCRIPT (botão "Detalhamento") e usado logo abaixo
  // pra reabrir a ampliação que estava aberta antes do reload do iframe.
  window.__pmcOpenZoom = openZoom;

  if (window.__pmcAutoZoom) {
    var autoBlock = document.querySelector('[data-block-id="' + window.__pmcAutoZoom + '"]');
    if (autoBlock) openZoom(autoBlock, true);
  }
})();
`;

// Só incluído quando editable=true. Faz o canvas postar mensagens pro
// window.parent a cada edição — texto (só no blur, pra não brigar com o
// cursor a cada tecla), clique em remover/adicionar/marcar pendente. Usa
// delegação de evento no document (focusout/click borbulham) em vez de
// listeners por elemento, então funciona também dentro do card clonado pelo
// zoom, sem precisar religar nada depois do clone.
const EDITABLE_SCRIPT = `
(function () {
  function post(msg) {
    window.parent.postMessage(Object.assign({ source: "pmc-canvas" }, msg), "*");
  }


  // A seção ampliada é um CLONE do bloco. Quem edita lá dentro mexe no clone,
  // não no card do grid — então o texto é copiado de volta pro campo original
  // (mesmos data-*). Sem isso, o app precisaria recarregar o iframe a cada
  // palavra digitada só pra ressincronizar, que é de onde vinham os flashes.
  function espelharNoCanvas(el) {
    if (!el.closest(".zoom-card")) return;
    var seletor = '[data-role="' + el.dataset.role + '"]';
    ["block", "group", "item", "section", "entry"].forEach(function (chave) {
      if (el.dataset[chave] !== undefined) {
        seletor += "[data-" + chave + '="' + el.dataset[chave] + '"]';
      }
    });
    var original = document.querySelector(".grid " + seletor);
    if (original && original !== el) original.textContent = el.textContent;
  }

  document.addEventListener("focusout", function (e) {
    var el = e.target;
    if (!el.matches) return;
    if (el.dataset && el.dataset.role) espelharNoCanvas(el);
    if (el.matches('[data-role="item-text"]')) {
      post({
        type: "item-text",
        blockId: el.dataset.block,
        groupIndex: Number(el.dataset.group),
        itemIndex: Number(el.dataset.item),
        text: el.textContent
      });
    } else if (el.matches('[data-role="subtitle-text"]')) {
      post({ type: "subtitle-text", blockId: el.dataset.block, text: el.textContent });
    } else if (el.matches('[data-role="footer-meta"]')) {
      post({ type: "footer-meta-text", text: el.textContent });
    } else if (el.matches('[data-role="full-text"]')) {
      // innerText, não textContent: aqui as quebras de linha são o conteúdo —
      // textContent juntaria os parágrafos colados num bloco só.
      post({ type: "full-text", blockId: el.dataset.block, text: el.innerText });
    } else if (el.matches('[data-role="group-label"]')) {
      post({
        type: "group-label-text",
        blockId: el.dataset.block,
        groupIndex: Number(el.dataset.group),
        text: el.textContent
      });
    } else if (el.matches('[data-role="detail-heading"]')) {
      post({
        type: "detail-heading-text",
        blockId: el.dataset.block,
        sectionIndex: Number(el.dataset.section),
        text: el.textContent
      });
    } else if (el.matches('[data-role="detail-intro"]')) {
      post({
        type: "detail-intro-text",
        blockId: el.dataset.block,
        sectionIndex: Number(el.dataset.section),
        text: el.textContent
      });
    } else if (
      el.matches('[data-role="detail-entry-label"]') ||
      el.matches('[data-role="detail-entry-text"]') ||
      el.matches('[data-role="detail-entry-note"]')
    ) {
      post({
        type: "detail-entry-text",
        blockId: el.dataset.block,
        sectionIndex: Number(el.dataset.section),
        entryIndex: Number(el.dataset.entry),
        field: el.dataset.role.replace("detail-entry-", ""),
        text: el.textContent
      });
    }
  });

  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-action]");
    if (!btn) return;
    e.stopPropagation();
    var action = btn.dataset.action;
    var blockId = btn.dataset.block;
    var groupIndex = Number(btn.dataset.group);
    var itemIndex = btn.dataset.item !== undefined ? Number(btn.dataset.item) : undefined;
    var sectionIndex = btn.dataset.section !== undefined ? Number(btn.dataset.section) : undefined;
    var entryIndex = btn.dataset.entry !== undefined ? Number(btn.dataset.entry) : undefined;

    // Não mexe no modelo: só amplia o bloco já na aba de texto corrido.
    if (action === "open-full-text") {
      var alvo = document.querySelector('[data-block-id="' + blockId + '"]');
      if (alvo && window.__pmcOpenZoom) {
        window.__pmcAutoTab = "full-text";
        window.__pmcOpenZoom(alvo);
      }
      return;
    }

    if (action === "remove-item") {
      post({ type: "item-remove", blockId: blockId, groupIndex: groupIndex, itemIndex: itemIndex });
    } else if (action === "add-item") {
      post({ type: "item-add", blockId: blockId, groupIndex: groupIndex });
    } else if (action === "toggle-pending") {
      post({ type: "item-toggle-pending", blockId: blockId, groupIndex: groupIndex, itemIndex: itemIndex });
    } else if (action === "add-group") {
      post({ type: "group-add", blockId: blockId });
    } else if (action === "remove-group") {
      post({ type: "group-remove", blockId: blockId, groupIndex: groupIndex });
    } else if (action === "add-detail-section") {
      post({ type: "detail-section-add", blockId: blockId });
    } else if (action === "remove-detail-section") {
      post({ type: "detail-section-remove", blockId: blockId, sectionIndex: sectionIndex });
    } else if (action === "add-detail-entry") {
      post({ type: "detail-entry-add", blockId: blockId, sectionIndex: sectionIndex });
    } else if (action === "remove-detail-entry") {
      post({
        type: "detail-entry-remove",
        blockId: blockId,
        sectionIndex: sectionIndex,
        entryIndex: entryIndex
      });
    }
  });
})();
`;

const EDITABLE_CSS = `
  /* Só na edição dentro do app: a folha usa toda a largura disponível e os
     blocos ficam mais altos, pra caber texto sem virar um campo apertado. O
     arquivo exportado continua com os 1280px e as alturas originais — este
     bloco de CSS não vai junto. */
  body { padding: 10px; }
  /* A folha mora dentro de um div que é o item flex do body; sem largura nele,
     o width:100% da folha não tem em quê se apoiar e ela encolhe pro tamanho
     do conteúdo. O :not(.backdrop) evita mexer no véu do modo slide. */
  body > div:not(.backdrop) { width: 100%; }
  .sheet { max-width: none; }
  .grid { grid-template-rows: repeat(6, minmax(160px, auto)); }
  .block { padding: 14px 16px; }

  [contenteditable] { outline-offset: 2px; border-radius: 4px; cursor: text; }
  [contenteditable]:hover { background: var(--accent-bg); }
  [contenteditable]:focus { outline: 2px solid var(--accent); background: var(--accent-bg); }
  [contenteditable]:empty::before {
    content: attr(data-placeholder);
    color: var(--muted);
    opacity: 0.7;
    cursor: text;
  }
  /* O card ampliado é um clone com outra classe (.zoom-card, não .block), por
     isso cada regra de item editável precisa valer nos dois. */
  .block li.li-edit, .zoom-card li.li-edit {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 6px;
  }
  /* Um pouco mais de respiro que o item só-leitura: aqui a bolinha do marcador
     e o texto editável ficavam quase encostados. O :not(.open) é porque o item
     marcado tem chip próprio (padding e bolinha em outro lugar) — mexer nele
     desalinharia o destaque. */
  .block li.li-edit:not(.open) { padding-left: 17px; }
  .block li.li-edit:not(.open)::before { top: 8px; }
  .block li.li-edit .item-text,
  .zoom-card li.li-edit .item-text { flex: 1; min-width: 0; }
  .item-controls { display: flex; gap: 2px; flex-shrink: 0; }
  .item-controls button {
    border: none;
    background: none;
    cursor: pointer;
    font-size: 9px;
    color: var(--line);
    line-height: 1;
    padding: 3px;
  }
  .item-controls button:hover { color: var(--accent-dark); }
  li.li-edit.open .item-controls button[data-action="toggle-pending"] { color: var(--accent-dark); }
  /* Discreto por opacidade, não por cor clara: em cima do chip do item
     marcado, um "✕" na cor da linha some por completo. */
  .item-controls button[data-action="remove-item"] {
    font-size: 10px;
    color: var(--muted);
    opacity: 0.45;
  }
  .item-controls button[data-action="remove-item"]:hover {
    color: var(--accent-dark);
    opacity: 1;
  }
  .zoom-card .item-controls button { font-size: 13px; padding: 5px; }
  .zoom-card .item-controls button[data-action="remove-item"] { font-size: 14px; }
  .add-item-btn {
    margin-top: 6px;
    font-size: 10px;
    color: var(--muted);
    background: none;
    border: 1px dashed var(--line);
    border-radius: 4px;
    padding: 3px 8px;
    cursor: pointer;
    align-self: flex-start;
  }
  .add-item-btn:hover { color: var(--accent-dark); border-color: var(--accent); }
  .full-text-btn {
    margin-top: 10px;
    align-self: flex-start;
    font-size: 10px;
    color: var(--muted);
    background: none;
    border: 1px dashed var(--line);
    border-radius: 4px;
    padding: 3px 8px;
    cursor: pointer;
  }
  .full-text-btn:hover { color: var(--accent-dark); border-color: var(--accent); }
  /* Dentro da ampliação a aba já existe — o atalho não faz sentido. */
  .zoom-card .full-text-btn { display: none; }
  .zoom-card .full-text-body {
    min-height: 220px;
    border: 1px dashed var(--line);
    border-radius: 8px;
    padding: 14px 16px;
  }
`;

// Só no modo completo (advanced): sublistas com título editável e a árvore de
// detalhamento. Nada disso vai pro HTML exportado — como o EDITABLE_CSS, só
// existe quando o canvas está sendo editado dentro do app.
const ADVANCED_CSS = `
  .sub-edit {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin: 8px 0 4px;
  }
  .sub-edit .sub { margin: 0; flex: 1; min-width: 0; }
  .sub-remove, .detail-remove {
    border: none;
    background: none;
    cursor: pointer;
    color: var(--line);
    line-height: 1;
    padding: 3px;
    font-size: 9px;
    flex-shrink: 0;
  }
  .sub-remove:hover, .detail-remove:hover { color: var(--accent-dark); }
  .add-group-btn {
    display: block;
    margin-top: 8px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--muted);
    background: none;
    border: 1px dashed var(--line);
    border-radius: 4px;
    padding: 3px 8px;
    cursor: pointer;
  }
  .add-group-btn:hover { color: var(--accent-dark); border-color: var(--accent); }
  .detail-legend {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 18px;
  }
  .detail-legend-title {
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--accent-dark);
  }
  .detail-legend-tag {
    font-size: 12px;
    color: var(--muted);
    background: var(--accent-bg);
    border-radius: 999px;
    padding: 3px 10px;
  }
  /* No modo completo a ampliação mostra as duas coisas: as listas do bloco em
     cima e o detalhamento embaixo (fora daqui, o card largo troca uma pela
     outra). */
  .zoom-card--wide .block-summary { display: block; }
  .zoom-card--wide .block-detail {
    margin-top: 24px;
    padding-top: 18px;
    border-top: 1px solid var(--line);
  }
  .zoom-card--wide .block-detail h3 { margin-top: 0; }
  .detail-section-edit + .detail-section-edit { margin-top: 26px; }
  .detail-head { display: flex; align-items: baseline; gap: 8px; }
  .detail-head h3 { flex: 1; min-width: 0; }
  .detail-head .detail-remove { font-size: 13px; }
  .zoom-card--wide .block-detail li.detail-edit {
    display: flex;
    align-items: flex-start;
    gap: 8px;
  }
  li.detail-edit .detail-fields { flex: 1; min-width: 0; }
  li.detail-edit .detail-remove { font-size: 12px; }
  .detail-fields strong:not(:empty)::after { content: " — "; }
  .detail-fields em { display: inline; margin-left: 6px; }
  /* O campo de prefixo (ex. "RN02") não tem placeholder escrito: uma palavra
     ali no meio da frase confundia mais do que ajudava. Vazio, ele é só um
     tracinho pontilhado clicável antes do texto da entrada. */
  .detail-fields strong:empty {
    display: inline-block;
    min-width: 22px;
    border-bottom: 1px dashed var(--line);
    vertical-align: middle;
  }
  .detail-fields strong:empty:hover, .detail-fields strong:empty:focus {
    border-bottom-color: var(--accent);
  }
  /* Os outros opcionais (observação, introdução) só anunciam o placeholder
     quando o mouse/foco chega perto — senão cada entrada viraria dois textos
     cinzas competindo com o conteúdo real. */
  .detail-fields em:empty::before,
  [data-role="detail-intro"]:empty::before { opacity: 0; }
  .detail-fields:hover em:empty::before,
  .detail-section-edit:hover [data-role="detail-intro"]:empty::before,
  [contenteditable]:focus:empty::before { opacity: 0.7; }
`;

export type RenderCanvasOptions = {
  editable?: boolean;
  /** Modo completo: sublistas e detalhamento editáveis (exige `editable`). */
  advanced?: boolean;
  /** Bloco cuja ampliação deve reabrir sozinha ao carregar (exige `editable`). */
  openZoomBlockId?: string | null;
};

export function renderCanvasHtml(
  model: CanvasModel,
  options?: RenderCanvasOptions,
): string {
  const editable = options?.editable ?? false;
  const advanced = editable && (options?.advanced ?? false);
  // Validado contra os ids conhecidos: o valor vem de uma postMessage do
  // iframe e é interpolado dentro de um <script>.
  const autoZoomId = BLOCK_DEFINITIONS.some(
    (def) => def.id === options?.openZoomBlockId,
  )
    ? options?.openZoomBlockId
    : null;
  const palette = getPalette(model.paletteId);
  const title = escapeHtml(model.projectName || "PM Canvas");
  const sheetLabel = escapeHtml(
    `Project Model Canvas do projeto ${model.projectName || "sem nome"}`,
  );
  const footerMetaText = escapeHtml(model.footerMeta);
  const footerMeta = editable
    ? `<span class="meta" contenteditable="true" data-role="footer-meta" data-placeholder="Adicionar texto do rodapé…">${footerMetaText}</span>`
    : `<span class="meta">${footerMetaText}</span>`;

  const blocksHtml = BLOCK_DEFINITIONS.map((def) =>
    renderBlockSection(def, model.blocks[def.id], editable, advanced),
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
    /* --backdrop, não --ink: em paleta escura o "ink" é claro, e o véu da
       ampliação viraria uma névoa branca. */
    background: color-mix(in srgb, var(--backdrop) 35%, transparent);
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

  /* Texto corrido: escondido no card do grid e atrás de uma aba na seção
     ampliada. O !important é pra vencer a regra do modo completo, que volta a
     mostrar o resumo dentro do card largo. */
  .block-full-text { display: none; }
  .zoom-card.show-full-text .block-full-text { display: block; }
  .zoom-card.show-full-text .block-summary,
  .zoom-card.show-full-text .block-detail { display: none !important; }
  .zoom-tabs {
    display: flex;
    gap: 4px;
    margin-bottom: 22px;
    border-bottom: 1px solid var(--line);
  }
  .zoom-tab {
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--muted);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    padding: 8px 12px;
    cursor: pointer;
  }
  .zoom-tab:hover { color: var(--ink); }
  .zoom-tab[aria-selected="true"] {
    color: var(--accent-dark);
    border-bottom-color: var(--accent-dark);
  }
  .full-text-body {
    white-space: pre-wrap;
    font-size: 15px;
    line-height: 1.75;
    color: var(--ink);
  }

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
  ${editable ? EDITABLE_CSS : ""}
  ${advanced ? ADVANCED_CSS : ""}
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
    ${footerMeta}
  </div>
</main>
</div>

${editable ? `<script>window.__pmcEditable = true;${autoZoomId ? `window.__pmcAutoZoom = ${JSON.stringify(autoZoomId)};` : ""}</script>` : ""}
<script>${GSAP_SOURCE}</script>
<script>${INTERACTION_SCRIPT}</script>
${editable ? `<script>${EDITABLE_SCRIPT}</script>` : ""}
</body>
</html>
`;
}
