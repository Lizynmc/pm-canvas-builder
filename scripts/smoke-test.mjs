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

async function shot(name) {
  await page.screenshot({ path: `${shotDir}/${name}.png`, fullPage: true });
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
await page.keyboard.type("Tutores sem com quem deixar o pet ao viajar");
await page.keyboard.press("Tab"); // sai do campo -> blur -> postMessage -> reload
await frame
  .locator(".block.b-justificativas")
  .getByText("Tutores sem com quem deixar o pet ao viajar")
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

console.log("8) clicar no header (fora do campo editável) ainda abre o zoom");
await frame.locator(".block.b-justificativas > header svg.ico").click();
await frame.locator(".zoom-overlay").waitFor({ state: "visible", timeout: 10000 });
console.log("   OK: zoom abre normalmente clicando no ícone/título");
await frame.locator(".zoom-x").click();
await frame.locator(".zoom-overlay").waitFor({ state: "detached", timeout: 10000 });

console.log("9) modo slide 16:9 continua funcionando");
await frame.locator("#slideToggle").click();
await frame.locator("body.slide-mode").waitFor({ timeout: 10000 });
await page.waitForTimeout(700);
await shot("09-slide-mode");
await frame.locator("#slideClose").click();
await frame.locator("body.slide-mode").waitFor({ state: "detached", timeout: 10000 });

console.log("10) baixar HTML: confirmar que a versão exportada não é editável");
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

console.log("11) refresh e restauração do rascunho");
await page.reload({ waitUntil: "networkidle" });
await page.locator("text=Rascunho restaurado do seu navegador.").waitFor({ timeout: 10000 });
await frame
  .locator(".block.b-justificativas")
  .getByText("Tutores sem com quem deixar o pet ao viajar")
  .waitFor({ timeout: 10000 });
console.log("   OK: edições feitas direto no canvas sobrevivem ao refresh (localStorage)");
await shot("11-apos-refresh");

console.log("\n--- console errors ---");
console.log(consoleErrors.length ? consoleErrors.join("\n") : "(nenhum)");

await browser.close();
