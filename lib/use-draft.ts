"use client";

import { useEffect, useRef, useState } from "react";
import type { CanvasModel } from "./canvas-schema";

const STORAGE_KEY = "pm-canvas-builder:draft:v1";
// Marca de "já avisei nesta aba". Mora no sessionStorage de propósito: ele
// morre quando a aba fecha, então trocar de rota (ou recarregar) não repete o
// aviso, mas abrir o site de novo sim.
const SESSION_KEY = "pm-canvas-builder:aviso-restauracao";
const DEBOUNCE_MS = 500;

export function useDraft(initial: CanvasModel) {
  const [model, setModel] = useState<CanvasModel>(initial);
  const [restored, setRestored] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    loadedRef.current = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        // Carregado depois da hidratação de propósito: o HTML gerado no
        // export estático não tem acesso ao localStorage do navegador, então
        // restaurar já no primeiro render causaria erro de hidratação.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setModel(JSON.parse(raw) as CanvasModel);

        let jaAvisou = false;
        try {
          jaAvisou = window.sessionStorage.getItem(SESSION_KEY) === "1";
          window.sessionStorage.setItem(SESSION_KEY, "1");
        } catch {
          // sessionStorage indisponível: avisa, e no máximo repete.
        }
        if (!jaAvisou) setRestored(true);
      }
    } catch {
      // Rascunho corrompido ou localStorage indisponível: segue com o modelo vazio.
    }
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    const id = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(model));
      } catch {
        // localStorage cheio ou indisponível: sem autosave, sem quebrar a UI.
      }
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [model]);

  function clearDraft() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage indisponível: nada a limpar.
    }
    setModel(initial);
  }

  return { model, setModel, clearDraft, restored };
}
