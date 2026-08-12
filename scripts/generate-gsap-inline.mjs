// Gera lib/gsap-inline.ts a partir de lib/vendor/gsap.min.js.
// Rodar de novo só se o GSAP vendorizado for atualizado: `node scripts/generate-gsap-inline.mjs`.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = readFileSync(path.join(root, "lib/vendor/gsap.min.js"), "utf8");

const out = `// Gerado por scripts/generate-gsap-inline.mjs a partir de lib/vendor/gsap.min.js.
// Não editar à mão — rode o script de novo se o GSAP vendorizado mudar.
export const GSAP_SOURCE = ${JSON.stringify(src)};
`;

writeFileSync(path.join(root, "lib/gsap-inline.ts"), out);
console.log(`lib/gsap-inline.ts gerado (${src.length} bytes de origem).`);
