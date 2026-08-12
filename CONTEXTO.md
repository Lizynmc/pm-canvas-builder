# Contexto do projeto

Documento de repasse: o que um agente (ou uma pessoa nova) precisa saber antes
de mexer neste repositório. Complementa o [README](README.md) (que explica
como rodar) com **o histórico das decisões, o estado de cada branch e as
armadilhas conhecidas**.

## Origem

O repo [fspet](https://github.com/Lizynmc/fspet) (Fábrica de Software I, IFRO
Vilhena) tem um `index.html` com um **Project Model Canvas** (modelo de José
Finocchio Júnior) feito à mão para um projeto específico. Os professores
gostaram do resultado e sugeriram que outros alunos usassem o mesmo formato.
Este repo nasceu daí: uma ferramenta separada, genérica, onde qualquer pessoa
preenche o conteúdo dos 13 blocos e exporta um `.html` autocontido com a
mesma identidade visual e as mesmas animações (GSAP) do canvas original.

## Decisão de arquitetura mais importante

**`lib/render-canvas-html.ts` é a fonte única de verdade do visual.** Não
existe uma versão "React" do canvas e uma versão "string" separada que
precisam ser mantidas em sincronia — é sempre a mesma função,
`renderCanvasHtml(model, options)`, que gera o HTML/CSS/JS completo a partir
do `CanvasModel`. Ela alimenta três lugares:

1. O botão **"Baixar HTML"** (gera um `Blob` e dispara o download).
2. O botão **"Abrir preview em nova aba"** (mesmo HTML, aberto direto no
   navegador — útil pra testar tela cheia e zoom de verdade, fora de um
   iframe encolhido).
3. O **canvas editável dentro do app** (branch `test-ui-in-canvas`), passando
   `{ editable: true }` — só nesse caso a função adiciona `contenteditable`,
   botões de editar/remover/pendente e o script que avisa o React das
   mudanças. `Baixar HTML` e `Abrir preview` **nunca** passam essa opção, então
   o arquivo exportado nunca carrega nada do modo de edição (testado
   explicitamente: o HTML baixado não pode conter `contenteditable="true"`
   nem `data-action=`).

Isso significa: **nunca reimplementar o visual do canvas como componentes
React "só pra mostrar".** Se precisar de uma nova forma de exibir/editar o
canvas, estenda `render-canvas-html.ts` (como foi feito pro modo editável),
não recrie o layout em JSX.

Toda cor vem de variáveis CSS (`--ink`, `--accent`, `--accent-dark`,
`--accent-bg`, `--paper`, `--muted`, `--line`, `--page-bg`, `--footer-text`,
`--backdrop`), definidas em `lib/palettes.ts`. Adicionar uma paleta nova é só
adicionar uma entrada lá — nada mais muda.

GSAP (`lib/vendor/gsap.min.js`) é embutido como texto em `lib/gsap-inline.ts`
(gerado por `scripts/generate-gsap-inline.mjs`) e injetado inline no
`<script>` do HTML exportado, pra o arquivo funcionar offline sem depender de
CDN. Só rodar o script de novo se o GSAP vendorizado for atualizado.

## Modelo de dados (`lib/canvas-schema.ts`)

Os 13 blocos do canvas (`justificativas`, `objsmart`, `beneficios`,
`produto`, `requisitos`, `stakeholders`, `equipe`, `restricoes`,
`premissas`, `entregas`, `riscos`, `tempo`, `custos`) têm posição no grid,
ícone e título **fixos** (`BLOCK_DEFINITIONS`) — isso é o que define o
modelo Project Model Canvas em si, não é algo que a pessoa deveria poder
reconfigurar. O que é editável por bloco (`CanvasBlock`):

- `subtitle` — só usado quando o bloco não tem `fixedSubtitle` (ex.
  "Linha do tempo" tem subtítulo livre; "Justificativas" tem o fixo
  "Passado", que não pode ser sobrescrito).
- `groups` — `groups[0]` é a lista principal do bloco; `groups[1:]` são
  subgrupos com título (ex. "Concorrentes" dentro de Stakeholders).
- `detail` — opcional, um detalhamento longo (títulos, notas, entradas com
  rótulo em negrito) que só aparece na seção ampliada (zoom). Generalizado a
  partir do que só existia em "Requisitos" no canvas original.

`CANVAS_SECTIONS` agrupa os 13 blocos nas 5 colunas conceituais do método
(Passado → Futuro, O quê, Quem, Como, Quando/Quanto) — usado só pra organizar
a UI do formulário, não afeta o canvas exportado.

## Estado das branches

| Branch | Conteúdo | Situação |
|---|---|---|
| `main` | Scaffold inicial + preview em nova aba + formulário reorganizado (divulgação progressiva, agrupado por coluna do canvas) | Publicada no GitHub |
| `test-ui` | Preview em nova aba + reorganização do formulário — **já mesclada em `main`** | Publicada, preservada por histórico |
| `test-simple-form` | Switch global "Modo simples" (uma textarea por bloco, parágrafo separado por linha em branco vira item) vs "Modo avançado" (formulário completo por item/subgrupo/detalhamento). Botão de ocultar/mostrar o preview. | Publicada no GitHub, **não mesclada em `main`** |
| `test-ui-in-canvas` | **Sem formulário separado — o canvas em si é o editor.** Baseada em `test-simple-form`. Ver seção própria abaixo. | Local, ainda não publicada |
| `test-canvas-completo` | `test-ui-in-canvas` + toggle **"Modo completo"** (sublistas e detalhamento editáveis no canvas), aba "Requisitos completos", rota `/canvas-form` com o formulário de volta e um sidebar pra alternar. Também troca paleta padrão, cores e favicon. Ver seção própria abaixo. | Local, ainda não publicada |

Todo o trabalho de formulário (`test-simple-form`) e o de edição direta no
canvas (`test-ui-in-canvas`) são **abordagens alternativas pro mesmo
problema**, exploradas em paralelo a pedido do usuário — não foram desenhadas
pra conviver. Antes de mesclar qualquer uma em `main`, vale decidir qual
direção vingou (ver "Estado em aberto" no fim deste documento).

### `test-ui-in-canvas` — edição direta no canvas

Ideia: em vez de formulário + preview lado a lado, a pessoa edita os itens
diretamente no canvas renderizado (feedback do usuário: "não seria melhor
para o UI a pessoa ir fazendo apenas no canvas mesmo?"). **Essa é a versão
que o usuário mais gostou até agora.**

Como funciona:
- `components/editable-canvas.tsx` renderiza `renderCanvasHtml(model, {
  editable: true })` num iframe e escuta `window.addEventListener("message",
  ...)`.
- O HTML editável (gerado em `render-canvas-html.ts`, funções
  `renderEditableMainGroup` / `EDITABLE_SCRIPT` / `EDITABLE_CSS`) tem:
  `contenteditable` nos itens/subtítulo/rodapé, botão "●" (marcar/desmarcar
  pendente), "✕" (remover item) e "+ item" (adicionar). O script injetado usa
  **delegação de evento no `document`** (`focusout`/`click`, que borbulham) —
  por isso funciona também dentro do card clonado pelo zoom, sem precisar
  religar handlers depois do clone.
- **Texto só é avisado ao React no `blur` do campo**, nunca a cada tecla —
  senão o iframe recarregaria (novo `srcDoc`) a cada letra digitada e brigaria
  com o cursor. Ações discretas (clicar em +/✕/●) podem recarregar o iframe
  sem problema, porque não há foco de texto ativo nesse momento.
- `lib/apply-canvas-edit.ts` tem a função pura `applyCanvasEdit(model,
  message)` que aplica cada tipo de mensagem (`item-text`, `item-remove`,
  `item-add`, `item-toggle-pending`, `subtitle-text`, `footer-meta-text`) no
  `CanvasModel`.
- O guard `e.target.closest("[contenteditable]")` no clique do header evita
  que editar o subtítulo (que fica dentro do `<header>`) também abra o zoom
  da seção — esse guard fica sempre presente no `INTERACTION_SCRIPT` (mesmo
  em export não-editável), porque é inofensivo quando não há nada
  `contenteditable` na página.

**Limitações conhecidas desta versão (ainda não resolvidas):**
- Só a lista principal (`groups[0]`) de cada bloco é editável no canvas.
  Subgrupo com título e detalhamento completo — os recursos "avançados" do
  formulário — não têm interface aqui. Se um rascunho antigo já tinha isso
  preenchido (feito via `test-simple-form`), continua aparecendo no canvas e
  no export, só não dá pra editar por essa via ainda.
- Cada ação discreta recarrega o iframe inteiro (pequeno flash visual).
- Clicar de um campo de texto direto para outro controle logo após o blur
  pode, em teoria, colidir com o recarregamento — não observado nos testes,
  mas é uma aresta viva.
- Sem "Modo simples/avançado", sem accordion — esses conceitos das branches
  anteriores não existem aqui (a edição direta os torna desnecessários).

### `test-canvas-completo` — o canvas inteiro editável, atrás de um toggle

Resolve as duas primeiras limitações da branch acima. O usuário pediu: "uma
branch que tenha a possibilidade de usar esse modelo, e aí quando vc ativa o
toggle, tem a lista completa pra preencher, com lista, subitem, sublista etc."

**Toggle "Modo completo"** (`lib/use-advanced-mode.ts`, chave própria no
`localStorage` — é preferência de edição, não conteúdo, então fica fora do
`CanvasModel` e do rascunho). Desligado, o canvas se comporta exatamente como
em `test-ui-in-canvas`. Ligado:

- **Sublistas** (`groups[1:]`) ganham título editável, `+ item`, `✕` pra
  remover a sublista e um `+ sublista` no fim de cada bloco. `groups[0]` não
  tem botão de remover: ela é o corpo do bloco, não uma sublista opcional.
- **Detalhamento** (`block.detail`) vira uma árvore editável — seção com
  título e introdução, entradas com rótulo/texto/observação, cada nível com
  seus botões de adicionar e remover.

**O detalhamento só existe dentro da seção ampliada.** Foi assim desde o
canvas original (`.block-detail` é `display: none` no card do grid) e o
usuário confirmou que é o certo — a primeira tentativa punha um botão
"Detalhamento" no rodapé de cada card e ficou confuso ("mostrar só em modo de
visualização, que seria quando clica pra abrir"). Hoje: o card não mostra
nada, e a ampliação abre com uma legenda `DETALHAMENTO · aparece só aqui, na
seção ampliada — não no canvas`, pra ninguém escrever ali e estranhar não ver
o texto no canvas. No modo completo a ampliação mostra as duas coisas (listas
em cima, detalhamento embaixo); fora dele o card largo continua trocando uma
pela outra, como antes.

**Ampliação sobrevive ao reload do iframe.** Como o detalhamento só é
alcançável com o zoom aberto, cada ação discreta (que recria o `srcdoc`)
fecharia a ampliação. O `INTERACTION_SCRIPT` avisa o React qual bloco está
ampliado (`zoom-open`/`zoom-close`, só quando `window.__pmcEditable`), o React
guarda isso **num ref** — abrir o zoom não pode recriar o iframe — e o próximo
HTML gerado traz `window.__pmcAutoZoom`, que reabre a mesma seção sem
animação. O id é validado contra `BLOCK_DEFINITIONS` antes de ser interpolado
no `<script>`.

**Fim dos flashes ao digitar** (o usuário reclamou: "está dando flashes quando
vou escrever no detalhamento"). Duas peças:

1. `EditableCanvas` só recria o iframe quando muda o **esqueleto** do canvas
   (`canvasStructureKey`: paleta, modo, quantidade de listas/itens/entradas,
   quais itens estão pendentes). Texto não entra na conta — no modo editável
   todo campo é renderizado existindo ou não conteúdo, então digitar nunca
   muda a estrutura do HTML, e o que a pessoa escreveu já está no DOM do
   iframe. Só ações discretas (clique) recarregam. De brinde, digitar o nome
   do projeto também parou de recarregar o canvas.
2. A ampliação é um **clone** do bloco: quem edita lá mexe no clone, não no
   card do grid. O `EDITABLE_SCRIPT` copia o texto de volta pro campo original
   (mesmos `data-*`) no `focusout` — sem isso o canvas ficaria desatualizado
   ao fechar a ampliação, que era justamente o motivo de recarregar o iframe a
   cada palavra.

Se for mexer aqui: **essas duas peças se sustentam uma na outra.** Tirar o
espelhamento sem tirar o `canvasStructureKey` deixa o card do grid com texto
velho; o contrário traz os flashes de volta. O smoke test cobre as duas
(marca o `document.body` do iframe antes de digitar e confere se sobreviveu;
depois fecha a ampliação e compara o texto do card).

**Aba "Requisitos completos"** (`CanvasBlock.fullText` +
`BlockDefinition.fullTextTab`). Só o bloco de Requisitos tem — é onde a lista
inteira costuma existir num documento à parte e não cabe em item de canvas.
O texto **nunca** aparece no card do grid: a seção ampliada ganha abas
(montadas em `openZoom`, depois de clonar o bloco), uma com o conteúdo normal
e outra com o texto corrido. No canvas há só um `+ texto completo`, que abre
a ampliação já na aba certa (`window.__pmcAutoTab`). Duas armadilhas:

- O campo é lido com **`innerText`**, não `textContent` — as quebras de linha
  aqui são o conteúdo, e `textContent` juntaria os parágrafos colados num
  bloco só.
- As regras que escondem resumo/detalhamento na aba de texto usam
  `!important`, senão o modo completo (que reexibe o resumo no card largo)
  ganharia por ordem de cascata.

**O campo de prefixo das entradas de detalhamento não tem placeholder
escrito.** Já teve a palavra "Rótulo"; o usuário achou confuso ("essa forma de
rótulo está confusa, remova a palavra rótulo daí"). Vazio, ele é só um
tracinho pontilhado clicável antes do texto — não volte a escrever nada ali.

## Regras e preferências combinadas com o usuário

- **Privacidade é estrutural, não só prometida.** `next.config.ts` usa
  `output: "export"` — build 100% estático, sem rota de API, sem servidor.
  Rascunho fica só em `localStorage` (nunca em servidor); ver
  `lib/use-draft.ts`.
- **Modo slide 16:9 usa rolagem interna, não corta conteúdo.** No canvas
  original (fspet), blocos com texto demais em modo slide (1280×720 fixo)
  eram cortados silenciosamente — aceitável lá porque o autor calibrava a
  mão. Numa ferramenta genérica, com conteúdo de terceiros, isso vira
  `overflow-y: auto` (decisão explícita do usuário).
- **Fonte Poppins** em todo o app (não só no canvas exportado) via
  `next/font/google`, e **shadcn com `sonner`** pra toasts — pedido explícito.
- **Separador de item no modo simples é linha em branco, não cada linha.**
  Foi tentado "cada linha vira um item" primeiro; o usuário pediu pra mudar
  porque cortava textos que ocupassem mais de uma linha. Parágrafo (bloco
  separado por uma ou mais linhas em branco) é a unidade; quebras de linha
  dentro de um parágrafo só unem o texto com espaço.
- **Ícones de marca (GitHub/LinkedIn) não existem no `lucide-react`
  instalado** (versão atual removeu ícones de logo). O footer usa um ícone
  genérico (`Link2`) com o nome ao lado.
- **Nada de conteúdo do projeto pet** (a partir de `test-canvas-completo`).
  O repo nasceu do `fspet`, mas exemplos, placeholders e o smoke test não
  podem carregar aquele projeto específico — a ferramenta é genérica. Isso
  inclui o antigo favicon do canvas exportado, que era uma patinha; hoje é o
  `layout-dashboard` do lucide (os quatro retângulos do grid), pintado com o
  accent da paleta. O ícone do app é o mesmo desenho, em `app/icon.svg` —
  `app/favicon.ico` (o padrão do Next) foi removido.
- **O canvas abre em "Preto"** (`DEFAULT_PALETTE_ID = "preto"`): bloco branco,
  página cinza, texto e ícones pretos, sem cor de destaque. Foi pedido como
  "tema preto" — a primeira tentativa entregou uma paleta *escura* (fundo
  preto, texto claro) e o usuário corrigiu: "quando eu disse preto, me referi
  ao fundo branco, fundo fundo cinza e os textos e icons pretos". Todas as
  paletas são claras hoje. O véu da ampliação usa `var(--backdrop)` e não
  `var(--ink)` — sobrou da tentativa escura, mas continua mais correto (com
  `ink` claro, viraria uma névoa branca).
- **Sem banner de privacidade.** Existia um `Alert` fixo explicando que nada
  vai pra servidor; o usuário mandou tirar ("não é necessário informar
  assim") e o componente foi apagado. A garantia continua valendo — é
  estrutural (`output: "export"`, sem servidor) —, só não é mais anunciada na
  tela.
- **As paletas Sálvia, Lilás e Menta saíram de cores que o usuário mandou**
  (#A5D6A4, #BC9FD0, #B7F1E5, #4E6E73), e a Âmbar foi removida a pedido dele.
  Como o canvas precisa de dez papéis de cor e não de quatro, cada cor entrou
  onde funciona (as de meio-tom viram `accent`; a menta clara é `accentBg` e
  `footerText` da Menta, com o petróleo no traço).
- **`components/ui/*` usa Base UI por baixo (`@base-ui/react`), não Radix.**
  A API de alguns componentes shadcn muda por causa disso — ex.: `Accordion`
  usa a prop `multiple` (boolean), não `type="multiple"` como na versão
  Radix mais comum em tutoriais.
- **Toda mudança visual é testada de verdade**, não só com typecheck/build.
  `scripts/smoke-test.mjs` usa Playwright (`npx playwright install
  chromium` uma vez) pra abrir o app num Chromium headless e exercitar o
  fluxo principal — o script muda de conteúdo conforme a branch (a versão
  atual, em `test-canvas-completo`, testa edição direta no canvas + modo
  completo + paletas; a de `test-simple-form` testava o formulário). Print de
  tela é conferido visualmente, não só "sem erro". Captura de ampliação tem
  que ser `fullPage: false`: o `.zoom-overlay` é `position: fixed` dentro do
  iframe e sai em branco numa captura de página inteira.
- **Branches de experimento partem umas das outras, a pedido do usuário**,
  pra poder comparar direções diferentes sem perder trabalho. Peça
  confirmação antes de mesclar ou apagar qualquer uma.
- **Não commitar nem dar push sem pedir, exceto quando o usuário disser
  explicitamente `commite`/`suba`.** Regra do fspet trazida pra cá: só agir
  quando autorizado, sinalizar o resto.

## Estado em aberto

- **Qual branch vira a direção definitiva?** `test-simple-form` (formulário
  com modo simples/avançado) e a linha `test-ui-in-canvas` →
  `test-canvas-completo` (edição direta no canvas, a favorita do usuário)
  resolvem o mesmo problema de formas incompatíveis. `test-canvas-completo`
  já cobre tudo que o formulário cobria, então é a candidata natural — falta
  o usuário decidir. Decidir antes de mesclar qualquer uma em `main`.
- **As duas abordagens agora convivem em rotas diferentes.** `/` é a edição
  direta no canvas; `/canvas-form` é o formulário de `test-simple-form`
  (acordeão por coluna do canvas, modo simples/completo, preview ao lado),
  trazido de volta a pedido do usuário. Um sidebar recolhível
  (`components/app-sidebar.tsx`, no layout) alterna entre as duas. **As duas
  rotas escrevem no mesmo rascunho** — `useDraft` usa uma chave só —, então dá
  pra ir e voltar sem perder nada; qualquer campo novo precisa existir nos
  dois lados (ex.: o `fullText` tem `contenteditable` no canvas e `Textarea`
  no `BlockEditor`). O sidebar também leva, no rodapé, o GitHub e o Lattes do
  usuário.
- **O repositório é privado e vai continuar.** Nada no app pode linkar pra
  ele: o sidebar aponta pro perfil do GitHub, não pro repo. Os links do
  projeto moram todos em `lib/project-links.ts`, porque aparecem no rodapé do
  app, no sidebar e dentro do HTML exportado — que é o arquivo que circula
  sozinho, sem o app junto.
- **Licença MIT**, com o link apontando pro site da licença
  (`opensource.org/license/mit`), não pro arquivo `LICENSE` do repo (que é
  privado). O HTML exportado termina com "Gerador de PM Canvas feito por
  Lizynmc no GitHub. Sob licença MIT." — `GENERATOR_URL` está **vazia de
  propósito** enquanto não houver deploy: preenchendo aquela constante, a
  frase passa sozinha a incluir "Acesse o gerador em …". Não aponte esse link
  pro repositório.
- **O botão de status do item é um círculo que enche quando marcado.** Era um
  caractere "●" que ficava idêntico nos dois estados — não dava pra saber,
  olhando, se o item estava em aberto. O "✕" ao lado fica discreto por
  `opacity`, não por cor clara: em cima do chip do item marcado, um "✕" na cor
  da linha sumia por completo.
- **Menos texto de apoio na tela, a pedido do usuário.** Saíram os títulos das
  colunas conceituais no formulário ("Passado → Futuro", "O quê"…) e o exemplo
  comprido do placeholder do modo simples. No lugar da separação por coluna,
  os 13 blocos viraram **uma lista numerada** na ordem do canvas — e os itens
  do modo completo também são numerados. `CANVAS_SECTIONS` continua em
  `canvas-schema.ts`, mas hoje ninguém usa.
- **LinkedIn:** `LINKEDIN_URL` em `app/layout.tsx` está vazia de propósito —
  o link só aparece no footer quando o usuário mandar a URL real.
- **Deploy:** ainda não configurado (nem perguntado). Diferente do `fspet`
  (Vercel automático a cada push na `main`), aqui nada foi decidido.
- **`test-ui-in-canvas` e `test-canvas-completo` só existem localmente** — as
  outras três branches (`main`, `test-ui`, `test-simple-form`) já foram
  enviadas ao GitHub.
- **`pnpm-workspace.yaml` e `pnpm-lock.yaml` entraram sem commit ainda.** O
  pnpm 11 trata script de build ignorado como erro fatal, então `pnpm install`
  (e por tabela `next dev`, que roda o install antes) falhava até `esbuild` e
  `unrs-resolver` serem liberados em `allowBuilds`. O repo ainda tem um
  `package-lock.json` do scaffold npm — conviver com os dois lockfiles convida
  divergência; escolher um.
