// Modelo de dados do Project Model Canvas (José Finocchio Júnior).
// Posição no grid, ícone e título de cada bloco são fixos — é o que define o
// modelo em si. O formulário só edita o conteúdo (grupos de itens e, opcionalmente,
// um detalhamento longo por bloco).

export type BlockId =
  | "justificativas"
  | "objsmart"
  | "beneficios"
  | "produto"
  | "requisitos"
  | "stakeholders"
  | "equipe"
  | "restricoes"
  | "premissas"
  | "entregas"
  | "riscos"
  | "tempo"
  | "custos";

export type CanvasItem = {
  text: string;
  pending?: boolean; // "aberto" — destacado em rosa/accent, pendente de decisão
};

export type CanvasGroup = {
  label?: string; // vira um <p class="sub">, ex. "Concorrentes", "Papéis"
  items: CanvasItem[];
};

export type DetailEntry = {
  label?: string; // ex. "RN02" — vira um prefixo em negrito
  text: string;
  note?: string; // aviso em itálico, ex. ressalva ou ponto em aberto
};

export type DetailSection = {
  heading: string;
  intro?: string;
  entries: DetailEntry[];
};

export type CanvasBlock = {
  subtitle?: string; // só usado quando a definição do bloco não tem fixedSubtitle
  groups: CanvasGroup[];
  detail?: DetailSection[]; // opcional — só aparece na seção ampliada (zoom)
  // Texto corrido, do tamanho que a pessoa quiser (a lista de requisitos
  // inteira, colada de outro documento). Só o bloco marcado com
  // `hasFullText` na definição usa isso, e ele aparece exclusivamente numa
  // aba própria da seção ampliada — nunca no card do canvas.
  fullText?: string;
};

export type CanvasModel = {
  projectName: string;
  footerMeta: string;
  paletteId: string;
  blocks: Record<BlockId, CanvasBlock>;
};

export type BlockDefinition = {
  id: BlockId;
  title: string;
  fixedSubtitle?: string; // termo da metodologia (ex. "Passado") — não editável
  gridColumn: string;
  gridRow: string;
  icon: string; // markup interno do <svg>, sem o wrapper
  // Ganha a aba de texto corrido na seção ampliada (ver CanvasBlock.fullText).
  // Só "Requisitos" tem: é o bloco em que a lista completa costuma existir
  // num documento à parte e não caber em item de canvas.
  fullTextTab?: string;
};

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  {
    id: "justificativas",
    title: "Justificativas",
    fixedSubtitle: "Passado",
    gridColumn: "1",
    gridRow: "1 / 3",
    icon: '<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>',
  },
  {
    id: "objsmart",
    title: "Obj SMART",
    gridColumn: "1",
    gridRow: "3 / 5",
    icon: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  },
  {
    id: "beneficios",
    title: "Benefícios",
    fixedSubtitle: "Futuro",
    gridColumn: "1",
    gridRow: "5 / 7",
    icon: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  },
  {
    id: "produto",
    title: "Produto",
    gridColumn: "2",
    gridRow: "1 / 3",
    icon: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/>',
  },
  {
    id: "requisitos",
    title: "Requisitos",
    fullTextTab: "Requisitos completos",
    gridColumn: "2",
    gridRow: "3 / 7",
    icon: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
  },
  {
    id: "stakeholders",
    title: "Stakeholders",
    fixedSubtitle: "& fatores externos",
    gridColumn: "3",
    gridRow: "1 / 4",
    icon: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  },
  {
    id: "equipe",
    title: "Equipe",
    gridColumn: "3",
    gridRow: "4 / 6",
    icon: '<path d="M18 21a8 8 0 0 0-16 0"/><circle cx="10" cy="8" r="5"/><path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3"/>',
  },
  {
    id: "restricoes",
    title: "Restrições",
    gridColumn: "3 / 5",
    gridRow: "6 / 7",
    icon: '<circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>',
  },
  {
    id: "premissas",
    title: "Premissas",
    gridColumn: "4",
    gridRow: "1 / 4",
    icon: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
  },
  {
    id: "entregas",
    title: "Grupo de entregas",
    gridColumn: "4",
    gridRow: "4 / 6",
    icon: '<path d="M12 3l4 2.2v4.4L12 12 8 9.6V5.2z"/><path d="M7 13l4 2.2v4.4L7 22l-4-2.4v-4.4z"/><path d="M17 13l4 2.2v4.4L17 22l-4-2.4v-4.4z"/>',
  },
  {
    id: "riscos",
    title: "Riscos",
    gridColumn: "5",
    gridRow: "1 / 4",
    icon: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  },
  {
    id: "tempo",
    title: "Linha do tempo",
    gridColumn: "5",
    gridRow: "4 / 6",
    icon: '<path d="M18 6H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h13l3-3z"/><path d="M12 3v3"/><path d="M12 12v9"/>',
  },
  {
    id: "custos",
    title: "Custos",
    gridColumn: "5",
    gridRow: "6 / 7",
    icon: '<circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/>',
  },
];

export const BLOCK_DEFINITION_MAP: Record<BlockId, BlockDefinition> =
  Object.fromEntries(BLOCK_DEFINITIONS.map((b) => [b.id, b])) as Record<
    BlockId,
    BlockDefinition
  >;

// Agrupamento dos 13 blocos nas 5 colunas conceituais do Project Model
// Canvas — usado só pra organizar o formulário, não afeta o layout do
// canvas exportado (esse continua fixo em BLOCK_DEFINITIONS).
export type CanvasSection = { label: string; blockIds: BlockId[] };

export const CANVAS_SECTIONS: CanvasSection[] = [
  { label: "Passado → Futuro", blockIds: ["justificativas", "objsmart", "beneficios"] },
  { label: "O quê", blockIds: ["produto", "requisitos"] },
  { label: "Quem", blockIds: ["stakeholders", "equipe"] },
  { label: "Como", blockIds: ["restricoes", "premissas", "entregas"] },
  { label: "Quando / Quanto", blockIds: ["riscos", "tempo", "custos"] },
];

export function emptyBlock(): CanvasBlock {
  return { groups: [{ items: [{ text: "" }] }] };
}

export function emptyCanvasModel(paletteId: string): CanvasModel {
  return {
    projectName: "",
    footerMeta: "",
    paletteId,
    blocks: Object.fromEntries(
      BLOCK_DEFINITIONS.map((b) => [b.id, emptyBlock()]),
    ) as Record<BlockId, CanvasBlock>,
  };
}
