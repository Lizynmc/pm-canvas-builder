import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Site 100% client-side: sem rotas de API, sem servidor que poderia guardar
  // o que a pessoa preenche. Reforça a promessa de privacidade na arquitetura.
  output: "export",
};

export default nextConfig;
