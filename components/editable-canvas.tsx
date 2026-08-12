"use client";

import { useEffect, useMemo, useRef } from "react";
import type { CanvasModel } from "@/lib/canvas-schema";
import { renderCanvasHtml } from "@/lib/render-canvas-html";
import type { CanvasEditMessage } from "@/lib/apply-canvas-edit";

// O iframe só é regenerado (srcDoc novo = reload completo) quando o modelo
// muda por uma ação discreta (+ item, remover, marcar pendente — todas
// disparadas por clique, então um reload logo em seguida não atrapalha).
// Digitar texto num campo contenteditable NÃO recria o iframe a cada tecla:
// o script injetado só avisa o React no blur do campo (ver EDITABLE_SCRIPT),
// senão a digitação brigaria com o cursor a cada re-render.
export function EditableCanvas({
  model,
  onEdit,
}: {
  model: CanvasModel;
  onEdit: (message: CanvasEditMessage) => void;
}) {
  const html = useMemo(() => renderCanvasHtml(model, { editable: true }), [model]);

  const onEditRef = useRef(onEdit);
  useEffect(() => {
    onEditRef.current = onEdit;
  }, [onEdit]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const data = event.data;
      if (!data || data.source !== "pmc-canvas") return;
      onEditRef.current(data as CanvasEditMessage);
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <iframe
      title="Canvas editável"
      srcDoc={html}
      allow="fullscreen"
      className="w-full rounded-md border bg-white"
      style={{ minHeight: 900 }}
    />
  );
}
