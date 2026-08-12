import type {
  BlockId,
  CanvasBlock,
  CanvasModel,
  DetailSection,
} from "./canvas-schema";

// Mensagens que o script injetado no HTML editável (ver EDITABLE_SCRIPT em
// render-canvas-html.ts) posta pro window.parent a cada edição direto no
// canvas. `source` é o campo usado pra filtrar mensagens de outras origens.
//
// As mensagens de grupo (sublista) e de detalhamento só são disparadas no
// modo completo; as de item/subtítulo/rodapé valem nos dois modos.
export type CanvasEditMessage =
  | { source: "pmc-canvas"; type: "item-text"; blockId: string; groupIndex: number; itemIndex: number; text: string }
  | { source: "pmc-canvas"; type: "item-remove"; blockId: string; groupIndex: number; itemIndex: number }
  | { source: "pmc-canvas"; type: "item-add"; blockId: string; groupIndex: number }
  | { source: "pmc-canvas"; type: "item-toggle-pending"; blockId: string; groupIndex: number; itemIndex: number }
  | { source: "pmc-canvas"; type: "subtitle-text"; blockId: string; text: string }
  | { source: "pmc-canvas"; type: "footer-meta-text"; text: string }
  | { source: "pmc-canvas"; type: "full-text"; blockId: string; text: string }
  | { source: "pmc-canvas"; type: "group-label-text"; blockId: string; groupIndex: number; text: string }
  | { source: "pmc-canvas"; type: "group-add"; blockId: string }
  | { source: "pmc-canvas"; type: "group-remove"; blockId: string; groupIndex: number }
  | { source: "pmc-canvas"; type: "detail-section-add"; blockId: string }
  | { source: "pmc-canvas"; type: "detail-section-remove"; blockId: string; sectionIndex: number }
  | { source: "pmc-canvas"; type: "detail-heading-text"; blockId: string; sectionIndex: number; text: string }
  | { source: "pmc-canvas"; type: "detail-intro-text"; blockId: string; sectionIndex: number; text: string }
  | { source: "pmc-canvas"; type: "detail-entry-add"; blockId: string; sectionIndex: number }
  | { source: "pmc-canvas"; type: "detail-entry-remove"; blockId: string; sectionIndex: number; entryIndex: number }
  | {
      source: "pmc-canvas";
      type: "detail-entry-text";
      blockId: string;
      sectionIndex: number;
      entryIndex: number;
      field: "label" | "text" | "note";
      text: string;
    };

// Avisos de ampliação aberta/fechada: não mexem no CanvasModel, só dizem ao
// app qual bloco reabrir depois que o iframe recarrega (ver EditableCanvas).
export type CanvasZoomMessage = {
  source: "pmc-canvas";
  type: "zoom-open" | "zoom-close";
  blockId: string | null;
};

export type CanvasMessage = CanvasEditMessage | CanvasZoomMessage;

export function isZoomMessage(
  message: CanvasMessage,
): message is CanvasZoomMessage {
  return message.type === "zoom-open" || message.type === "zoom-close";
}

// Mensagens que só carregam texto digitado dentro do canvas. Importam porque,
// nesses casos, o DOM do iframe já está com o valor certo — o app guarda o
// texto sem precisar recriar o iframe (ver EditableCanvas).
const TEXT_ONLY_TYPES = new Set([
  "item-text",
  "subtitle-text",
  "footer-meta-text",
  "full-text",
  "group-label-text",
  "detail-heading-text",
  "detail-intro-text",
  "detail-entry-text",
]);

export function isTextOnlyMessage(message: CanvasEditMessage): boolean {
  return TEXT_ONLY_TYPES.has(message.type);
}

function withBlock(
  model: CanvasModel,
  blockId: BlockId,
  block: CanvasBlock,
): CanvasModel {
  return { ...model, blocks: { ...model.blocks, [blockId]: block } };
}

type DetailMessage = Extract<CanvasEditMessage, { type: `detail-${string}` }>;

function isDetailMessage(message: CanvasEditMessage): message is DetailMessage {
  return message.type.startsWith("detail-");
}

// Mensagens de detalhamento, separadas só pra não inchar a função principal.
function applyDetailEdit(
  block: CanvasBlock,
  message: DetailMessage,
): CanvasBlock {
  const detail = block.detail ?? [];

  if (message.type === "detail-section-add") {
    return { ...block, detail: [...detail, { heading: "", entries: [{ text: "" }] }] };
  }

  const section = detail[message.sectionIndex];
  if (!section) return block;

  let next: DetailSection;
  if (message.type === "detail-section-remove") {
    return { ...block, detail: detail.filter((_, i) => i !== message.sectionIndex) };
  } else if (message.type === "detail-heading-text") {
    next = { ...section, heading: message.text };
  } else if (message.type === "detail-intro-text") {
    next = { ...section, intro: message.text };
  } else if (message.type === "detail-entry-add") {
    next = { ...section, entries: [...section.entries, { text: "" }] };
  } else if (message.type === "detail-entry-remove") {
    const entries = section.entries.filter((_, i) => i !== message.entryIndex);
    next = { ...section, entries: entries.length > 0 ? entries : [{ text: "" }] };
  } else {
    const { field, text } = message;
    next = {
      ...section,
      entries: section.entries.map((entry, i) => {
        if (i !== message.entryIndex) return entry;
        if (field === "label") return { ...entry, label: text };
        if (field === "note") return { ...entry, note: text };
        return { ...entry, text };
      }),
    };
  }

  return {
    ...block,
    detail: detail.map((s, i) => (i === message.sectionIndex ? next : s)),
  };
}

export function applyCanvasEdit(
  model: CanvasModel,
  message: CanvasEditMessage,
): CanvasModel {
  if (message.type === "footer-meta-text") {
    return { ...model, footerMeta: message.text };
  }

  const blockId = message.blockId as BlockId;
  const block = model.blocks[blockId];
  if (!block) return model;

  if (message.type === "subtitle-text") {
    return withBlock(model, blockId, { ...block, subtitle: message.text });
  }

  if (message.type === "full-text") {
    return withBlock(model, blockId, { ...block, fullText: message.text });
  }

  if (isDetailMessage(message)) {
    return withBlock(model, blockId, applyDetailEdit(block, message));
  }

  if (message.type === "group-add") {
    return withBlock(model, blockId, {
      ...block,
      groups: [...block.groups, { label: "", items: [{ text: "" }] }],
    });
  }

  // A lista principal (groups[0]) não pode ser removida: ela é o corpo do
  // bloco, não uma sublista opcional.
  if (message.type === "group-remove") {
    if (message.groupIndex === 0) return model;
    return withBlock(model, blockId, {
      ...block,
      groups: block.groups.filter((_, i) => i !== message.groupIndex),
    });
  }

  const { groupIndex } = message;
  const group = block.groups[groupIndex];
  if (!group) return model;

  if (message.type === "group-label-text") {
    const groups = block.groups.map((g, i) =>
      i === groupIndex ? { ...g, label: message.text } : g,
    );
    return withBlock(model, blockId, { ...block, groups });
  }

  let items = group.items;
  if (message.type === "item-text") {
    items = group.items.map((item, i) =>
      i === message.itemIndex ? { ...item, text: message.text } : item,
    );
  } else if (message.type === "item-toggle-pending") {
    items = group.items.map((item, i) =>
      i === message.itemIndex ? { ...item, pending: !item.pending } : item,
    );
  } else if (message.type === "item-remove") {
    const next = group.items.filter((_, i) => i !== message.itemIndex);
    items = next.length > 0 ? next : [{ text: "" }];
  } else if (message.type === "item-add") {
    items = [...group.items, { text: "" }];
  }

  const groups = block.groups.map((g, i) => (i === groupIndex ? { ...g, items } : g));
  return withBlock(model, blockId, { ...block, groups });
}
