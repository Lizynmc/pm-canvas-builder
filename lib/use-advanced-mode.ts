"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "pm-canvas-builder:modo-completo:v1";

// Modo completo (sublistas + detalhamento editáveis no canvas). Não faz parte
// do CanvasModel — é preferência de edição, não conteúdo do canvas —, então
// mora numa chave própria do localStorage, separada do rascunho.
export function useAdvancedMode() {
  const [advanced, setAdvanced] = useState(false);

  useEffect(() => {
    try {
      // Lido depois da hidratação de propósito, como o rascunho: o HTML do
      // export estático não tem localStorage, e ler no primeiro render
      // causaria erro de hidratação.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (window.localStorage.getItem(STORAGE_KEY) === "1") setAdvanced(true);
    } catch {
      // localStorage indisponível: começa no modo simples.
    }
  }, []);

  function toggleAdvanced(next: boolean) {
    setAdvanced(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // Sem persistir a preferência; a sessão atual continua funcionando.
    }
  }

  return { advanced, toggleAdvanced };
}
