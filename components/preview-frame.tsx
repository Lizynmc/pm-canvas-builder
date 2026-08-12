"use client";

import { useMemo } from "react";
import type { CanvasModel } from "@/lib/canvas-schema";
import { renderCanvasHtml } from "@/lib/render-canvas-html";

export function PreviewFrame({ model }: { model: CanvasModel }) {
  const html = useMemo(() => renderCanvasHtml(model), [model]);

  return (
    <iframe
      title="Pré-visualização do canvas"
      srcDoc={html}
      allow="fullscreen"
      className="w-full h-full min-h-[600px] rounded-md border bg-white"
    />
  );
}
