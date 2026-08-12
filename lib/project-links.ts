// Links e crédito do projeto, num lugar só: eles aparecem no rodapé do app,
// no sidebar e — o que mais importa — dentro do HTML exportado, que é o
// arquivo que circula por aí sem o app junto.

// Endereço público do gerador (Vercel). É o link que o botão "Compartilhar"
// copia — precisa ser este, e não `window.location.origin`, senão quem
// compartilha rodando local acabaria divulgando um localhost.
export const GENERATOR_URL = "https://pm-canvas-builder.vercel.app";

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
