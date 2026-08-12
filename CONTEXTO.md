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

## Regras e preferências combinadas com o usuário

- **Privacidade é estrutural, não só prometida.** `next.config.ts` usa
  `output: "export"` — build 100% estático, sem rota de API, sem servidor.
  Rascunho fica só em `localStorage` (nunca em servidor); ver
  `lib/use-draft.ts`. O banner de privacidade (`components/privacy-banner.tsx`)
  é sempre visível.
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
- **`components/ui/*` usa Base UI por baixo (`@base-ui/react`), não Radix.**
  A API de alguns componentes shadcn muda por causa disso — ex.: `Accordion`
  usa a prop `multiple` (boolean), não `type="multiple"` como na versão
  Radix mais comum em tutoriais.
- **Toda mudança visual é testada de verdade**, não só com typecheck/build.
  `scripts/smoke-test.mjs` usa Playwright (`npx playwright install
  chromium` uma vez) pra abrir o app num Chromium headless e exercitar o
  fluxo principal — o script muda de conteúdo conforme a branch (a versão
  atual, em `test-ui-in-canvas`, testa edição direta no canvas; a de
  `test-simple-form` testava o formulário). Print de tela é conferido
  visualmente, não só "sem erro".
- **Branches de experimento partem umas das outras, a pedido do usuário**,
  pra poder comparar direções diferentes sem perder trabalho. Peça
  confirmação antes de mesclar ou apagar qualquer uma.
- **Não commitar nem dar push sem pedir, exceto quando o usuário disser
  explicitamente `commite`/`suba`.** Regra do fspet trazida pra cá: só agir
  quando autorizado, sinalizar o resto.

## Estado em aberto

- **Qual branch vira a direção definitiva?** `test-simple-form` (formulário
  com modo simples/avançado) e `test-ui-in-canvas` (edição direta no canvas,
  a favorita do usuário até agora) resolvem o mesmo problema de formas
  incompatíveis. Decidir isso antes de mesclar qualquer uma em `main`.
- **LinkedIn:** `LINKEDIN_URL` em `app/layout.tsx` está vazia de propósito —
  o link só aparece no footer quando o usuário mandar a URL real.
- **Deploy:** ainda não configurado (nem perguntado). Diferente do `fspet`
  (Vercel automático a cada push na `main`), aqui nada foi decidido.
- **`test-ui-in-canvas` só existe localmente** até este commit — as outras
  três branches (`main`, `test-ui`, `test-simple-form`) já foram enviadas ao
  GitHub.
