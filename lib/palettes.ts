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
  {
    id: "ambar",
    name: "Âmbar",
    ink: "#241A10",
    accent: "#E08A22",
    accentDark: "#93500A",
    accentBg: "#FCEEDC",
    paper: "#FFFFFF",
    muted: "#6B5E4F",
    line: "#EEE0CE",
    pageBg: "#FAF3E9",
    footerText: "#F3D9AE",
    backdrop: "#140F0A",
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

export const DEFAULT_PALETTE_ID = "rosa";

export function getPalette(id: string): Palette {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}
