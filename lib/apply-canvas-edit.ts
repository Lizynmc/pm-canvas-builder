import type { BlockId, CanvasModel } from "./canvas-schema";

// Mensagens que o script injetado no HTML editável (ver EDITABLE_SCRIPT em
// render-canvas-html.ts) posta pro window.parent a cada edição direto no
// canvas. `source` é o campo usado pra filtrar mensagens de outras origens.
export type CanvasEditMessage =
  | { source: "pmc-canvas"; type: "item-text"; blockId: string; groupIndex: number; itemIndex: number; text: string }
  | { source: "pmc-canvas"; type: "item-remove"; blockId: string; groupIndex: number; itemIndex: number }
  | { source: "pmc-canvas"; type: "item-add"; blockId: string; groupIndex: number }
  | { source: "pmc-canvas"; type: "item-toggle-pending"; blockId: string; groupIndex: number; itemIndex: number }
  | { source: "pmc-canvas"; type: "subtitle-text"; blockId: string; text: string }
  | { source: "pmc-canvas"; type: "footer-meta-text"; text: string };

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
    return {
      ...model,
      blocks: { ...model.blocks, [blockId]: { ...block, subtitle: message.text } },
    };
  }

  const { groupIndex } = message;
  const group = block.groups[groupIndex];
  if (!group) return model;

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
  return {
    ...model,
    blocks: { ...model.blocks, [blockId]: { ...block, groups } },
  };
}
