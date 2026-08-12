# PM Canvas Builder

Ferramenta pra montar um [Project Model Canvas](https://www.napratica.org.br/project-model-canvas/)
(modelo de José Finocchio Júnior) preenchendo um formulário e exportar um
`.html` autocontido — mesma identidade visual e mesmas animações (zoom de
seção, modo slide 16:9) do canvas original deste template.

100% client-side: sem conta, sem backend, sem banco de dados. Nada do que é
preenchido é enviado a um servidor. Um rascunho fica guardado só no
`localStorage` do navegador (autosave), e a única forma de guardar o
resultado é baixando o HTML gerado.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Build (export estático)

```bash
npm run build
```

Gera um site 100% estático em `out/` — sem rotas de API, sem servidor.

## Arquitetura

- `lib/canvas-schema.ts` — os 13 blocos fixos do modelo (posição, ícone,
  título) e os tipos do conteúdo que a pessoa preenche.
- `lib/palettes.ts` — paletas de cores pré-definidas.
- `lib/render-canvas-html.ts` — fonte única de verdade do visual: monta o
  HTML/CSS/JS final a partir do modelo + paleta. Usada tanto no preview ao
  vivo (`components/preview-frame.tsx`) quanto no botão "Baixar HTML" —
  preview e export nunca divergem porque são o mesmo output.
- `lib/gsap-inline.ts` — GSAP vendorizado (`lib/vendor/gsap.min.js`) embutido
  como texto, pra o HTML exportado funcionar offline. Gerado por
  `scripts/generate-gsap-inline.mjs`; rodar de novo só se o GSAP vendorizado
  for atualizado.
- `lib/use-draft.ts` — autosave em `localStorage` (rascunho local, nunca em
  servidor).

## Teste de fumaça

`scripts/smoke-test.mjs` usa Playwright pra abrir o app de verdade num
Chromium headless e conferir o fluxo principal (preencher bloco, trocar
paleta, zoom, modo slide com rolagem interna, download, restauração do
rascunho). Requer `npx playwright install chromium` uma vez. Com o dev
server rodando em `localhost:3000`:

```bash
node scripts/generate-gsap-inline.mjs
node scripts/smoke-test.mjs
```
