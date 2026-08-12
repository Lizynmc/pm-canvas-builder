import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const shotDir = "/tmp/pm-canvas-shots";
mkdirSync(shotDir, { recursive: true });

const consoleErrors = [];

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

async function shot(name) {
  await page.screenshot({ path: `${shotDir}/${name}.png` });
  console.log(`screenshot: ${name}.png`);
}

console.log("1) modo simples: parágrafo com quebra de linha interna vira 1 item só");
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Benefícios" }).click();
const frame = page.frameLocator('iframe[title="Pré-visualização do canvas"]');
const beneficiosTextarea = page.locator("textarea").first();
await beneficiosTextarea.fill(
  "Facilidade e agilidade na busca por profissionais\ncapacitados, para os tutores",
);
await frame
  .locator("text=Facilidade e agilidade na busca por profissionais capacitados, para os tutores")
  .waitFor({ timeout: 10000 });
const beneficiosLiCount = await frame.locator(".block.b-beneficios li").count();
console.log(`   <li> gerados a partir de 1 parágrafo em 2 linhas (esperado 1): ${beneficiosLiCount}`);
if (beneficiosLiCount !== 1) {
  console.log("   FALHA: quebra de linha sem linha em branco não devia criar um item novo");
} else {
  console.log("   OK: quebra de linha dentro do parágrafo não corta o item");
}
await shot("01-paragrafo-multilinha");

console.log("2) modo simples: linha em branco separa itens");
await page.getByRole("button", { name: "Justificativas" }).click();
// Justificativas vem antes de Benefícios na seção "Passado → Futuro", então
// no DOM o textarea dela fica em primeiro, mesmo tendo sido aberta depois.
const justTextarea = page.locator("textarea").first();
await justTextarea.fill(
  "Tutores sem com quem deixar o pet\n\nFalta termo de responsabilidade",
);
await frame.locator("text=Tutores sem com quem deixar o pet").waitFor({ timeout: 10000 });
await frame.locator("text=Falta termo de responsabilidade").waitFor({ timeout: 10000 });
const liCount = await frame.locator(".block.b-justificativas li").count();
console.log(`   <li> gerados a partir de 2 parágrafos (esperado 2): ${liCount}`);
if (liCount !== 2) {
  console.log("   FALHA: esperava exatamente 2 <li>");
} else {
  console.log("   OK: linha em branco separa itens corretamente");
}
await shot("02-linha-em-branco-separa");

console.log("2b) trocar pro modo avançado sem perder o conteúdo, marcar 'em aberto'");
await page.getByRole("button", { name: "Modo avançado" }).click();
const secondItemInput = page.locator('input[placeholder="Item"]').nth(1);
await secondItemInput.waitFor({ timeout: 10000 });
const secondItemValue = await secondItemInput.inputValue();
console.log(`   valor do segundo item após trocar de modo: "${secondItemValue}"`);
if (secondItemValue !== "Falta termo de responsabilidade") {
  console.log("   FALHA: conteúdo não foi preservado ao trocar de modo");
}
await page.locator('label:has-text("Em aberto")').nth(1).getByRole("switch").click();
await frame.locator("li.open", { hasText: "Falta termo de responsabilidade" }).waitFor({ timeout: 10000 });
console.log("   OK: item 'em aberto' aparece destacado (li.open) no preview");
await shot("02b-bloco-preenchido");

console.log("3) trocar paleta rosa -> roxo");
await page.getByRole("button", { name: /Roxo/ }).click();
await frame.locator("html").waitFor();
const accentColor = await frame.locator(".block").first().evaluate(() => {
  return getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
});
console.log(`   --accent no preview após trocar pra roxo: ${accentColor}`);
if (accentColor.toLowerCase() !== "#7b10e8") {
  console.log(`   FALHA: esperava #7B10E8, veio ${accentColor}`);
} else {
  console.log("   OK: paleta roxo aplicada no preview");
}
await shot("03-paleta-roxo");

console.log("4) zoom de seção dentro do iframe");
await frame.locator(".block.b-justificativas > header").click();
await frame.locator(".zoom-overlay").waitFor({ state: "visible", timeout: 10000 });
await shot("04-zoom-aberto");
await frame.locator(".zoom-x").click();
await frame.locator(".zoom-overlay").waitFor({ state: "detached", timeout: 10000 });
console.log("   OK: zoom abre e fecha");

console.log("5) modo slide 16:9 + overflow com scroll interno");
const longText =
  "Texto propositalmente muito longo pra forçar overflow dentro do bloco em modo slide 1280x720. ".repeat(20);
await secondItemInput.fill(longText);
await frame.locator("li.open", { hasText: longText.slice(0, 30) }).waitFor({ timeout: 10000 });
await frame.locator("#slideToggle").click();
await frame.locator("body.slide-mode").waitFor({ timeout: 10000 });
await page.waitForTimeout(700); // aguarda animação GSAP de entrada
await shot("05-slide-mode");
const overflowY = await frame
  .locator(".block.b-justificativas")
  .evaluate((el) => getComputedStyle(el).overflowY);
console.log(`   overflow-y do bloco em slide-mode: ${overflowY}`);
if (overflowY !== "auto" && overflowY !== "scroll") {
  console.log("   FALHA: esperava overflow-y auto/scroll, não hidden");
} else {
  const scrollable = await frame.locator(".block.b-justificativas").evaluate((el) => el.scrollHeight > el.clientHeight);
  console.log(`   conteúdo realmente maior que a área visível (precisa rolar): ${scrollable}`);
  console.log("   OK: modo slide usa rolagem interna em vez de cortar");
}
await frame.locator("#slideClose").click();
await frame.locator("body.slide-mode").waitFor({ state: "detached", timeout: 10000 });

console.log("6) baixar HTML");
const [download] = await Promise.all([
  page.waitForEvent("download", { timeout: 10000 }),
  page.getByRole("button", { name: "Baixar HTML" }).click(),
]);
const downloadPath = await download.path();
console.log(`   OK: download disparado, arquivo salvo em ${downloadPath}, nome sugerido: ${download.suggestedFilename()}`);

console.log("7) refresh e restauração do rascunho (toast)");
await page.reload({ waitUntil: "networkidle" });
await page.locator("text=Rascunho restaurado do seu navegador.").waitFor({ timeout: 10000 });
console.log("   OK: toast de rascunho restaurado apareceu");
// Accordion reabre fechado após reload (não é parte do modelo) — confirma os
// dados restaurados pelo preview, que sempre renderiza o modelo inteiro.
const frameAfterReload = page.frameLocator('iframe[title="Pré-visualização do canvas"]');
await frameAfterReload
  .locator("text=Tutores sem com quem deixar o pet")
  .waitFor({ timeout: 10000 });
console.log("   OK: conteúdo do rascunho restaurado aparece no preview");
await shot("07-apos-refresh");

console.log("8) abrir preview em nova aba (fora do iframe encolhido)");
const [popup] = await Promise.all([
  page.context().waitForEvent("page"),
  page.getByRole("button", { name: "Abrir preview em nova aba" }).click(),
]);
await popup.waitForLoadState("domcontentloaded");
await popup.locator("#sheet").waitFor({ timeout: 10000 });
console.log("   OK: preview abriu em nova aba com o canvas renderizado");
await popup.screenshot({ path: `${shotDir}/08-preview-nova-aba.png` });
await popup.close();

console.log("9) ocultar/mostrar o painel de preview");
await page.getByRole("button", { name: "Ocultar preview" }).click();
const iframeGone = (await page.locator('iframe[title="Pré-visualização do canvas"]').count()) === 0;
console.log(`   iframe removido da página ao ocultar: ${iframeGone}`);
if (!iframeGone) console.log("   FALHA: preview continua no DOM depois de ocultar");
await shot("09-preview-oculto");
await page.getByRole("button", { name: "Mostrar preview" }).click();
await page.locator('iframe[title="Pré-visualização do canvas"]').waitFor({ timeout: 10000 });
console.log("   OK: preview volta ao clicar em 'Mostrar preview'");

console.log("\n--- console errors ---");
console.log(consoleErrors.length ? consoleErrors.join("\n") : "(nenhum)");

await browser.close();
