"use client";

import { useEffect, useRef } from "react";
import { BLOCK_DEFINITIONS, type CanvasModel } from "@/lib/canvas-schema";
import { renderCanvasHtml } from "@/lib/render-canvas-html";
import {
  isTextOnlyMessage,
  isZoomMessage,
  type CanvasEditMessage,
  type CanvasMessage,
} from "@/lib/apply-canvas-edit";

// Assinatura de tudo que muda o ESQUELETO do canvas editável: paleta, modo,
// quantidade de listas/itens/entradas e quais itens estão pendentes. O texto
// em si fica de fora de propósito — no modo editável todo campo é renderizado
// existindo ou não conteúdo, então digitar nunca muda a estrutura do HTML.
//
// É isso que acaba com os flashes: enquanto a assinatura não muda, o iframe
// não é recriado, porque o que a pessoa digitou já está no DOM dele.
function canvasStructureKey(model: CanvasModel, advanced: boolean): string {
  const blocks = BLOCK_DEFINITIONS.map((def) => {
    const block = model.blocks[def.id];
    const groups = block.groups
      .map((group) => group.items.map((item) => (item.pending ? "1" : "0")).join(""))
      .join(",");
    const detail = (block.detail ?? [])
      .map((section) => section.entries.length)
      .join(",");
    return `${groups};${detail}`;
  });
  return [model.paletteId, advanced ? "1" : "0", ...blocks].join("|");
}

// O iframe só é recriado (srcdoc novo = reload completo) quando essa assinatura
// muda — ou seja, em ações discretas (+ item, remover, marcar pendente, +
// sublista, + entrada) e ao trocar de paleta ou de modo, todas disparadas por
// clique. Digitar não recria nada: o script injetado avisa o React no blur do
// campo (ver EDITABLE_SCRIPT) e o React guarda o texto sem mexer no iframe.
export function EditableCanvas({
  model,
  advanced,
  onEdit,
}: {
  model: CanvasModel;
  advanced: boolean;
  onEdit: (message: CanvasEditMessage) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const renderedRef = useRef<{ signature: string; structure: string } | null>(null);
  const typedInCanvasRef = useRef(false);
  // Qual bloco está ampliado. Fica num ref, não em estado: abrir a ampliação
  // não pode recriar o iframe (isso cortaria a animação) — o valor só é lido
  // no próximo reload, pra reabrir a mesma seção onde a pessoa estava.
  const zoomBlockIdRef = useRef<string | null>(null);

  const onEditRef = useRef(onEdit);
  useEffect(() => {
    onEditRef.current = onEdit;
  }, [onEdit]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const data = event.data as CanvasMessage | undefined;
      if (!data || data.source !== "pmc-canvas") return;
      if (isZoomMessage(data)) {
        zoomBlockIdRef.current = data.type === "zoom-open" ? data.blockId : null;
        return;
      }
      typedInCanvasRef.current = isTextOnlyMessage(data);
      onEditRef.current(data);
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // srcdoc escrito na mão (em vez da prop srcDoc do React) pra poder ler os
  // refs aqui, num efeito, em vez de durante o render.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Tudo que o canvas mostra (o nome do projeto fica de fora: ele só vai pro
    // <title> do arquivo, não aparece no desenho).
    const signature = JSON.stringify([
      model.paletteId,
      model.footerMeta,
      model.blocks,
      advanced,
    ]);
    const structure = canvasStructureKey(model, advanced);
    const digitado = typedInCanvasRef.current;
    typedInCanvasRef.current = false;
    const rendered = renderedRef.current;

    if (rendered) {
      // Nada visível mudou.
      if (signature === rendered.signature) return;
      // Mudou só texto digitado dentro do próprio iframe: o DOM de lá já está
      // certo (a seção ampliada espelha no card de trás), recriar só piscaria.
      if (digitado && structure === rendered.structure) {
        renderedRef.current = { signature, structure };
        return;
      }
    }

    renderedRef.current = { signature, structure };
    iframe.srcdoc = renderCanvasHtml(model, {
      editable: true,
      advanced,
      openZoomBlockId: zoomBlockIdRef.current,
    });
  }, [model, advanced]);

  // Sem fundo nem borda próprios: o iframe já pinta o `pageBg` da paleta, e
  // quem o envolve repete a mesma cor — a emenda tem que ser invisível.
  return (
    <iframe
      ref={iframeRef}
      title="Canvas editável"
      allow="fullscreen"
      className="w-full rounded-md"
      style={{ minHeight: 900 }}
    />
  );
}
