// Links e crédito do projeto, num lugar só: eles aparecem no rodapé do app,
// no sidebar e — o que mais importa — dentro do HTML exportado, que é o
// arquivo que circula por aí sem o app junto.

// Endereço público do gerador. Vazio até existir deploy: o repositório é
// privado e vai continuar assim, então não há link de repo pra oferecer.
// Assim que o app for publicado, basta preencher aqui — o crédito do HTML
// exportado passa a trazer a frase completa ("Acesse o gerador em …")
// sozinho, ver renderCanvasHtml.
export const GENERATOR_URL = "";

export const AUTHOR_GITHUB_URL = "https://github.com/Lizynmc";
export const AUTHOR_GITHUB_HANDLE = "Lizynmc";
export const LATTES_URL = "http://lattes.cnpq.br/7960579048014901";

export const LICENSE_NAME = "MIT";
export const LICENSE_URL = "https://opensource.org/license/mit";

// Texto que vai junto quando alguém copia o link do gerador. O crédito mora
// aqui, e não dentro do canvas exportado: o arquivo que a pessoa baixa é o
// trabalho dela, quem divulga a ferramenta é quem compartilha o link.
export function shareMessage(url: string): string {
  return `Acesse o gerador de PM Canvas em ${url} — feito por ${AUTHOR_GITHUB_HANDLE} no GitHub. Sob licença ${LICENSE_NAME}.`;
}
