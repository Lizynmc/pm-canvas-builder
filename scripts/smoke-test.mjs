import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";

const shotDir = "/tmp/pm-canvas-shots";
mkdirSync(shotDir, { recursive: true });

const consoleErrors = [];
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

// fullPage por padrão. A ampliação (zoom-overlay) é position:fixed dentro do
// iframe e sai em branco numa captura fullPage — nesses casos, viewport only.
async function shot(name, { fullPage = true } = {}) {
  await page.screenshot({ path: `${shotDir}/${name}.png`, fullPage });
  console.log(`screenshot: ${name}.png`);
}

const frame = page.frameLocator('iframe[title="Canvas editável"]');

console.log("1) carregar app e o canvas editável");
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await frame.locator("#sheet").waitFor({ timeout: 10000 });
console.log("   OK: canvas carregado");
await shot("01-inicial");

console.log("2) editar texto de um item existente direto no canvas");
const firstItem = frame.locator('.block.b-justificativas [data-role="item-text"]').first();
await firstItem.click();
await page.keyboard.type("Processo de matricula ainda e feito no papel");
await page.keyboard.press("Tab"); // sai do campo -> blur -> postMessage -> reload
await frame
  .locator(".block.b-justificativas")
  .getByText("Processo de matricula ainda e feito no papel")
  .waitFor({ timeout: 10000 });
console.log("   OK: texto editado direto no canvas persistiu");
await shot("02-item-editado");

console.log("3) adicionar um item novo com o botão '+ item'");
await frame.locator('.block.b-justificativas [data-action="add-item"]').click();
await frame.locator('.block.b-justificativas [data-role="item-text"]').nth(1).waitFor({ timeout: 10000 });
let itemCount = await frame.locator('.block.b-justificativas [data-role="item-text"]').count();
console.log(`   itens em Justificativas após adicionar (esperado 2): ${itemCount}`);
if (itemCount !== 2) console.log("   FALHA: esperava 2 itens");

console.log("4) escrever no item novo e marcar como pendente");
const secondItem = frame.locator('.block.b-justificativas [data-role="item-text"]').nth(1);
await secondItem.click();
await page.keyboard.type("Falta termo de responsabilidade");
await page.keyboard.press("Tab");
await frame
  .locator(".block.b-justificativas")
  .getByText("Falta termo de responsabilidade")
  .waitFor({ timeout: 10000 });
await frame.locator('.block.b-justificativas [data-action="toggle-pending"]').nth(1).click();
await frame
  .locator(".block.b-justificativas li.open", { hasText: "Falta termo de responsabilidade" })
  .waitFor({ timeout: 10000 });
console.log("   OK: item novo escrito e marcado como pendente (li.open)");
await shot("04-item-pendente");

console.log("5) remover o item pendente");
await frame.locator('.block.b-justificativas [data-action="remove-item"]').nth(1).click();
await page.waitForTimeout(400);
itemCount = await frame.locator('.block.b-justificativas [data-role="item-text"]').count();
console.log(`   itens em Justificativas após remover (esperado 1): ${itemCount}`);
if (itemCount !== 1) console.log("   FALHA: esperava voltar a 1 item");

console.log("6) editar subtítulo (bloco sem subtítulo fixo) direto no canvas");
await frame.locator('.block.b-tempo [data-role="subtitle-text"]').click();
await page.keyboard.type("21 encontros · terças · 4h");
await page.keyboard.press("Tab");
await frame.locator(".block.b-tempo small").getByText("21 encontros").waitFor({ timeout: 10000 });
const zoomOpenAfterSubtitle = await frame.locator(".zoom-overlay").count();
console.log(`   zoom-overlay aberto sem querer ao editar subtítulo: ${zoomOpenAfterSubtitle > 0}`);
if (zoomOpenAfterSubtitle > 0) {
  console.log("   FALHA: editar subtítulo não devia abrir o zoom");
} else {
  console.log("   OK: subtítulo editado sem abrir o zoom (clique não borbulhou pro header)");
}

console.log("7) editar o texto do rodapé direto no canvas");
await frame.locator('[data-role="footer-meta"]').click();
await page.keyboard.type("Fábrica de Software I · IFRO Vilhena · 2026/2");
await page.keyboard.press("Tab");
await frame.locator(".footer .meta").getByText("Fábrica de Software I").waitFor({ timeout: 10000 });
console.log("   OK: rodapé editado direto no canvas");
await shot("07-rodape-editado");

console.log("8) ligar o modo completo");
await page.getByRole("switch").click();
await frame.locator('.block.b-stakeholders [data-action="add-group"]').waitFor({ timeout: 10000 });
console.log("   OK: controles do modo completo apareceram (+ sublista)");
await shot("08-modo-completo");

console.log("9) criar uma sublista com título e um item dentro dela");
await frame.locator('.block.b-stakeholders [data-action="add-group"]').click();
await frame.locator('.block.b-stakeholders [data-role="group-label"]').waitFor({ timeout: 10000 });
await frame.locator('.block.b-stakeholders [data-role="group-label"]').click();
await page.keyboard.type("Concorrentes");
await page.keyboard.press("Tab");
await frame.locator(".block.b-stakeholders").getByText("Concorrentes").waitFor({ timeout: 10000 });
await frame.locator('.block.b-stakeholders [data-group="1"][data-role="item-text"]').first().click();
await page.keyboard.type("Sistema legado da secretaria");
await page.keyboard.press("Tab");
await frame.locator(".block.b-stakeholders").getByText("Sistema legado da secretaria").waitFor({ timeout: 10000 });
console.log("   OK: sublista com título e item criada direto no canvas");
await shot("09-sublista");

console.log("10) preencher o detalhamento (só existe na seção ampliada)");
// O card do grid não mostra nada de detalhamento: se abre pelo título do bloco.
const detalheNoCard = await frame.locator(".block.b-requisitos .block-detail:visible").count();
console.log(`   detalhamento visível no card do grid (esperado false): ${detalheNoCard > 0}`);
if (detalheNoCard > 0) console.log("   FALHA: o detalhamento não devia aparecer no canvas");
await frame.locator(".block.b-requisitos > header svg.ico").click();
await frame.locator(".zoom-card").waitFor({ state: "visible", timeout: 10000 });
await frame
  .locator(".zoom-card .detail-legend-tag")
  .getByText("aparece só aqui")
  .waitFor({ timeout: 10000 });
console.log("   OK: ampliação abre com a legenda avisando onde esse texto aparece");
await frame.locator('.zoom-card [data-action="add-detail-section"]').click();
// A ação recarrega o iframe: se a ampliação não fosse reaberta sozinha, o
// campo abaixo nunca apareceria — é este passo que testa a persistência do zoom.
await frame.locator('.zoom-card [data-role="detail-heading"]').waitFor({ timeout: 10000 });
console.log("   OK: ampliação reabriu sozinha depois do reload do iframe");
await frame.locator('.zoom-card [data-role="detail-heading"]').click();
await page.keyboard.type("Requisitos não funcionais");
await page.keyboard.press("Tab");
await frame.locator(".zoom-card h3").getByText("Requisitos não funcionais").waitFor({ timeout: 10000 });
// Marca o documento do iframe: se ele for recriado enquanto a pessoa digita,
// a marca some — é assim que este teste flagra o flash de volta.
await frame.locator("body").evaluate((body) => {
  body.dataset.marca = "sem-reload";
});
await frame.locator('.zoom-card [data-role="detail-entry-label"]').first().click();
await page.keyboard.type("RN02");
await page.keyboard.press("Tab");
await frame.locator('.zoom-card [data-role="detail-entry-text"]').first().waitFor({ timeout: 10000 });
await frame.locator('.zoom-card [data-role="detail-entry-text"]').first().click();
await page.keyboard.type("Resposta em até 2s nas telas de busca");
await page.keyboard.press("Tab");
await frame.locator(".zoom-card").getByText("Resposta em até 2s nas telas de busca").waitFor({ timeout: 10000 });
console.log("   OK: detalhamento preenchido dentro da ampliação");

const semReload = await frame
  .locator("body")
  .evaluate((body) => body.dataset.marca === "sem-reload");
console.log(`   iframe sobreviveu à digitação, sem recarregar (sem flash): ${semReload}`);
if (!semReload) console.log("   FALHA: digitar recriou o iframe — o flash voltou");

// O texto digitado dentro da ampliação (um clone do bloco) tem que estar
// espelhado no card do grid, senão o canvas ficaria desatualizado ao fechar.
await frame.locator(".zoom-x").click();
await frame.locator(".zoom-overlay").waitFor({ state: "detached", timeout: 10000 });
const espelhou = await frame
  .locator('.grid .block.b-requisitos [data-role="detail-entry-text"]')
  .first()
  .textContent();
console.log(`   texto espelhado no bloco do grid: ${espelhou === "Resposta em até 2s nas telas de busca"}`);
if (espelhou !== "Resposta em até 2s nas telas de busca") {
  console.log("   FALHA: o card do grid ficou com o texto antigo");
}
await frame.locator(".block.b-requisitos > header svg.ico").click();
await frame.locator(".zoom-card").waitFor({ state: "visible", timeout: 10000 });
await page.mouse.move(0, 0); // tira o hover dos campos antes da foto
await page.waitForTimeout(700); // deixa a animação de abertura terminar
await shot("10-detalhamento", { fullPage: false });
await frame.locator(".zoom-x").click();
await frame.locator(".zoom-overlay").waitFor({ state: "detached", timeout: 10000 });

console.log("10.5) texto completo de Requisitos, na aba própria da ampliação");
await frame.locator('.block.b-requisitos [data-action="open-full-text"]').click();
await frame.locator(".zoom-card.show-full-text").waitFor({ timeout: 10000 });
console.log("   OK: atalho abre a ampliação já na aba de texto completo");
await frame.locator('.zoom-card [data-role="full-text"]').click();
await page.keyboard.type("RF01 - Cadastrar aluno com CPF e turma.");
await page.keyboard.press("Enter");
await page.keyboard.type("RF02 - Emitir comprovante de matricula em PDF.");
await page.keyboard.press("Tab");
await frame.locator(".zoom-card").getByText("RF02 - Emitir comprovante").waitFor({ timeout: 10000 });
await page.mouse.move(0, 0);
await shot("10b-texto-completo", { fullPage: false });
// Voltar pra primeira aba tem que trazer o conteúdo do bloco de volta.
await frame.locator(".zoom-tab").first().click();
await frame.locator(".zoom-card .block-summary").waitFor({ state: "visible", timeout: 10000 });
console.log("   OK: as duas abas alternam o conteúdo da ampliação");
await frame.locator(".zoom-x").click();
await frame.locator(".zoom-overlay").waitFor({ state: "detached", timeout: 10000 });
const textoNoCanvas = await frame.locator(".block.b-requisitos .block-full-text:visible").count();
console.log(`   texto completo visível no card do canvas (esperado false): ${textoNoCanvas > 0}`);
if (textoNoCanvas > 0) console.log("   FALHA: esse texto não devia aparecer no canvas");

console.log("11) clicar no header (fora do campo editável) ainda abre o zoom");
await frame.locator(".block.b-justificativas > header svg.ico").click();
await frame.locator(".zoom-overlay").waitFor({ state: "visible", timeout: 10000 });
console.log("   OK: zoom abre normalmente clicando no ícone/título");
await frame.locator(".zoom-x").click();
await frame.locator(".zoom-overlay").waitFor({ state: "detached", timeout: 10000 });

console.log("11.5) trocar de paleta (as novas: Sálvia, Lilás, Menta)");
for (const nome of ["Sálvia", "Lilás", "Menta"]) {
  await page.getByRole("button", { name: nome }).click();
  await page.waitForTimeout(500);
  await shot(`11-paleta-${nome.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "")}`);
}
const temAmbar = await page.getByRole("button", { name: "Âmbar" }).count();
console.log(`   paleta Âmbar ainda existe (esperado false): ${temAmbar > 0}`);
if (temAmbar > 0) console.log("   FALHA: a Âmbar devia ter sido removida");

console.log("12) modo slide 16:9 continua funcionando");
await frame.locator("#slideToggle").click();
await frame.locator("body.slide-mode").waitFor({ timeout: 10000 });
await page.waitForTimeout(700);
await shot("12-slide-mode", { fullPage: false });
await frame.locator("#slideClose").click();
await frame.locator("body.slide-mode").waitFor({ state: "detached", timeout: 10000 });

console.log("13) baixar HTML: confirmar que a versão exportada não é editável");
const [download] = await Promise.all([
  page.waitForEvent("download", { timeout: 10000 }),
  page.getByRole("button", { name: "Baixar HTML" }).click(),
]);
const downloadPath = await download.path();
const downloadedHtml = readFileSync(downloadPath, "utf8");
// 'contenteditable' sozinho aparece sempre (é só o seletor do guard que
// impede o clique no header de abrir zoom quando o alvo é editável — inerte
// quando não há nenhum elemento contenteditable). O que importa é não ter
// nenhum atributo contenteditable="true" de verdade nem os botões de ação.
const hasEditableAttrs = downloadedHtml.includes('contenteditable="true"');
const hasEditButtons = downloadedHtml.includes("data-action=");
console.log(`   HTML baixado tem atributos contenteditable="true": ${hasEditableAttrs}`);
console.log(`   HTML baixado tem botões de edição (data-action): ${hasEditButtons}`);
if (hasEditableAttrs || hasEditButtons) {
  console.log("   FALHA: export não deveria ter os atributos/botões do modo editável");
} else {
  console.log("   OK: export limpo, sem contenteditable de verdade nem botões de edição");
}
// O conteúdo criado no modo completo tem que chegar no HTML exportado.
const exportaSublista =
  downloadedHtml.includes('<p class="sub">Concorrentes</p>') &&
  downloadedHtml.includes("Sistema legado da secretaria");
const exportaDetalhe =
  downloadedHtml.includes("Requisitos não funcionais") &&
  downloadedHtml.includes("<strong>RN02</strong>") &&
  downloadedHtml.includes("Resposta em até 2s nas telas de busca");
const exportaTextoCompleto =
  downloadedHtml.includes("RF01 - Cadastrar aluno com CPF e turma.") &&
  downloadedHtml.includes("RF02 - Emitir comprovante de matricula em PDF.");
console.log(`   sublista com título no export: ${exportaSublista}`);
console.log(`   detalhamento no export: ${exportaDetalhe}`);
console.log(`   texto completo de Requisitos no export: ${exportaTextoCompleto}`);
// O HTML exportado é o que circula sozinho — tem que levar o crédito junto.
const exportaCredito =
  downloadedHtml.includes("Gerador de PM Canvas feito por") &&
  downloadedHtml.includes("https://opensource.org/license/mit") &&
  downloadedHtml.includes("licença MIT");
console.log(`   crédito + licença MIT no export: ${exportaCredito}`);
if (!exportaCredito) console.log("   FALHA: o export devia levar o crédito e a licença");
if (!exportaSublista || !exportaDetalhe || !exportaTextoCompleto) {
  console.log("   FALHA: o que foi escrito no modo completo não chegou no export");
}

console.log("14) refresh e restauração do rascunho");
await page.reload({ waitUntil: "networkidle" });
await page.locator("text=Rascunho restaurado do seu navegador.").waitFor({ timeout: 10000 });
await frame
  .locator(".block.b-justificativas")
  .getByText("Processo de matricula ainda e feito no papel")
  .waitFor({ timeout: 10000 });
console.log("   OK: edições feitas direto no canvas sobrevivem ao refresh (localStorage)");
await shot("14-apos-refresh");

console.log("14.5) licença MIT no rodapé do app");
const licencaNoRodape = await page.getByRole("link", { name: "Licença MIT" }).count();
console.log(`   link "Licença MIT" no rodapé: ${licencaNoRodape > 0}`);
if (licencaNoRodape === 0) console.log("   FALHA: falta a licença no rodapé");

console.log("15) banner de privacidade removido");
const temBanner = await page.getByText("Nada do que você preenche aqui").count();
console.log(`   banner ainda na tela (esperado false): ${temBanner > 0}`);
if (temBanner > 0) console.log("   FALHA: o banner devia ter saído");

console.log("16) sidebar leva pro formulário, com o mesmo rascunho");
await page.getByRole("link", { name: "Preencher por formulário" }).click();
await page.waitForURL("**/canvas-form**", { timeout: 15000 });
await page.getByRole("heading", { name: "Preencher por formulário" }).waitFor({ timeout: 10000 });
await page.getByRole("button", { name: "1. Justificativas" }).click();
const textoNoForm = await page.locator("textarea").first().inputValue();
const mesmoRascunho = textoNoForm.includes("Processo de matricula ainda e feito no papel");
console.log(`   formulário abriu com o texto escrito no canvas: ${mesmoRascunho}`);
if (!mesmoRascunho) console.log("   FALHA: as duas rotas deviam compartilhar o rascunho");
const lattes = page.getByRole("link", { name: "Lattes" });
const repo = page.getByRole("link", { name: "GitHub" });
console.log(`   links do sidebar (GitHub + Lattes): ${(await repo.count()) > 0 && (await lattes.count()) > 0}`);
if ((await repo.count()) === 0 || (await lattes.count()) === 0) {
  console.log("   FALHA: faltam os links externos no sidebar");
}
const lattesHref = await lattes.getAttribute("href");
if (lattesHref !== "http://lattes.cnpq.br/7960579048014901") {
  console.log(`   FALHA: href do Lattes errado (${lattesHref})`);
}
const temLabelPreview = await page.getByText("Pré-visualização ao vivo").count();
console.log(`   label "Pré-visualização ao vivo" ainda existe (esperado false): ${temLabelPreview > 0}`);
if (temLabelPreview > 0) console.log("   FALHA: esse texto devia ter saído");
await shot("16-formulario");

console.log("16.5) em tela estreita, os botões não ficam cobertos pelo preview");
await page.setViewportSize({ width: 1100, height: 900 });
await page.waitForTimeout(300);
// click com trial: passa pelos testes de acionabilidade (visível, não coberto
// por outro elemento) sem clicar de verdade — falha se algo estiver por cima.
try {
  await page.getByRole("button", { name: "Limpar rascunho" }).click({ trial: true, timeout: 5000 });
  console.log("   OK: 'Limpar rascunho' alcançável em 1100px");
} catch {
  console.log("   FALHA: 'Limpar rascunho' está coberto em tela estreita");
}
await shot("16b-formulario-estreito", { fullPage: false });
await page.setViewportSize({ width: 1440, height: 1100 });
await page.waitForTimeout(300);

console.log("17) menu recolhe e volta pro canvas");
await page.getByRole("button", { name: "Recolher menu" }).click();
await page.getByRole("button", { name: "Expandir menu" }).waitFor({ timeout: 10000 });
await page.getByRole("link", { name: "Editar no canvas" }).click();
await page.waitForURL((url) => !url.pathname.includes("canvas-form"), { timeout: 15000 });
await frame.locator("#sheet").waitFor({ timeout: 15000 });
console.log("   OK: menu recolhe e a navegação volta pro canvas");
await shot("17-menu-recolhido");

console.log("\n--- console errors ---");
console.log(consoleErrors.length ? consoleErrors.join("\n") : "(nenhum)");

await browser.close();
