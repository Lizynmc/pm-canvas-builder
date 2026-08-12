// Paletas pré-definidas. Cada uma define o conjunto completo de cores usado
// pelo canvas exportado (ver lib/render-canvas-html.ts). Adicionar uma nova
// paleta é só acrescentar uma entrada aqui — nada mais precisa mudar.

export type Palette = {
  id: string;
  name: string;
  ink: string;
  accent: string;
  accentDark: string;
  accentBg: string;
  paper: string;
  muted: string;
  line: string;
  pageBg: string;
  footerText: string;
  backdrop: string;
};

export const PALETTES: Palette[] = [
  // A que abre por padrão. Monocromática: bloco branco, página cinza, texto e
  // ícones pretos — sem cor de destaque nenhuma, o "pendente" é um chip cinza
  // em vez de colorido.
  {
    id: "preto",
    name: "Preto",
    ink: "#0A0A0A",
    accent: "#1F1F1F",
    accentDark: "#000000",
    accentBg: "#EBEBEC",
    paper: "#FFFFFF",
    muted: "#6B6B70",
    line: "#E2E2E4",
    pageBg: "#F2F2F3",
    footerText: "#C9C9CD",
    backdrop: "#0A0A0A",
  },
  {
    id: "rosa",
    name: "Rosa",
    ink: "#1A1518",
    accent: "#D4537E",
    accentDark: "#993556",
    accentBg: "#FBEAF0",
    paper: "#FFFFFF",
    muted: "#6B6266",
    line: "#E5DDE0",
    pageBg: "#F3EDEF",
    footerText: "#E8C7D4",
    backdrop: "#12080C",
  },
  {
    id: "roxo",
    name: "Roxo",
    ink: "#26103F",
    accent: "#7B10E8",
    accentDark: "#4E0B9E",
    accentBg: "#EFE3FD",
    paper: "#FFFFFF",
    muted: "#6E5F80",
    line: "#E4D8F0",
    pageBg: "#E9DEF9",
    footerText: "#D5BDF7",
    backdrop: "#12080C",
  },
  {
    id: "azul",
    name: "Azul",
    ink: "#101826",
    accent: "#2F6FED",
    accentDark: "#163E85",
    accentBg: "#E7EEFD",
    paper: "#FFFFFF",
    muted: "#5B6472",
    line: "#DDE3EF",
    pageBg: "#EEF2F9",
    footerText: "#BFD3FA",
    backdrop: "#0B0F1A",
  },
  {
    id: "verde",
    name: "Verde",
    ink: "#12241A",
    accent: "#1F9D55",
    accentDark: "#12572E",
    accentBg: "#E4F5EA",
    paper: "#FFFFFF",
    muted: "#57695F",
    line: "#DCEAE1",
    pageBg: "#EEF6F1",
    footerText: "#BFE6CC",
    backdrop: "#0B140F",
  },
  // As três abaixo saíram das cores que você mandou (#A5D6A4, #BC9FD0,
  // #B7F1E5, #4E6E73). Como o canvas precisa de dez papéis de cor e não de
  // quatro, cada cor entrou no papel em que ela funciona: as duas de meio-tom
  // viram o accent das duas primeiras, e a menta clara + o petróleo escuro
  // formam a terceira (menta no fundo/rodapé, petróleo no traço).
  {
    id: "salvia",
    name: "Sálvia",
    ink: "#22322D",
    accent: "#A5D6A4",
    accentDark: "#4A7C59",
    accentBg: "#E9F5E8",
    paper: "#FFFFFF",
    muted: "#5F726B",
    line: "#DCE7DC",
    pageBg: "#EFF5EE",
    footerText: "#C6E4C4",
    backdrop: "#0E1613",
  },
  {
    id: "lilas",
    name: "Lilás",
    ink: "#241C2E",
    accent: "#BC9FD0",
    accentDark: "#6E4F8A",
    accentBg: "#F1EAF7",
    paper: "#FFFFFF",
    muted: "#6A5F78",
    line: "#E5DCEC",
    pageBg: "#F2EDF7",
    footerText: "#DBC7E9",
    backdrop: "#100B16",
  },
  {
    id: "menta",
    name: "Menta",
    ink: "#1B2B2D",
    accent: "#4E6E73",
    accentDark: "#38585C",
    accentBg: "#B7F1E5",
    paper: "#FFFFFF",
    muted: "#5E7377",
    line: "#DBE8E7",
    pageBg: "#EDF6F4",
    footerText: "#B7F1E5",
    backdrop: "#0A1416",
  },
  {
    id: "grafite",
    name: "Grafite",
    ink: "#16181B",
    accent: "#C9A227",
    accentDark: "#7A6110",
    accentBg: "#F5EFDA",
    paper: "#FFFFFF",
    muted: "#6B7078",
    line: "#E1E3E6",
    pageBg: "#EDEEEF",
    footerText: "#E7D9A8",
    backdrop: "#0C0D0E",
  },
];

export const DEFAULT_PALETTE_ID = "preto";

export function getPalette(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}
