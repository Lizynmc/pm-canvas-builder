"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, ExternalLink, RotateCcw } from "lucide-react";
import { emptyCanvasModel } from "@/lib/canvas-schema";
import { DEFAULT_PALETTE_ID } from "@/lib/palettes";
import { renderCanvasHtml } from "@/lib/render-canvas-html";
import { useDraft } from "@/lib/use-draft";
import { applyCanvasEdit } from "@/lib/apply-canvas-edit";
import { PalettePicker } from "@/components/palette-picker";
import { PrivacyBanner } from "@/components/privacy-banner";
import { EditableCanvas } from "@/components/editable-canvas";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function Home() {
  const { model, setModel, clearDraft, restored } = useDraft(
    emptyCanvasModel(DEFAULT_PALETTE_ID),
  );

  useEffect(() => {
    if (restored) toast.info("Rascunho restaurado do seu navegador.");
  }, [restored]);

  function handleDownload() {
    // Sempre a versão não-editável: o HTML baixado não pode carregar os
    // botões/contenteditable do modo de edição.
    const html = renderCanvasHtml(model);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(model.projectName) || "pm-canvas"}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("HTML baixado.");
  }

  function handleOpenPreview() {
    const html = renderCanvasHtml(model);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleClear() {
    clearDraft();
    toast.success("Rascunho limpo.");
  }

  return (
    <main className="max-w-[1400px] mx-auto w-full p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">PM Canvas Builder</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Edite direto no canvas abaixo: clique em qualquer item pra escrever,
          passe o mouse pra ver os controles de remover e marcar como
          pendente (●), e use o botão &quot;+ item&quot; no fim de cada lista.
        </p>
      </div>

      <PrivacyBanner />

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="projectName">Nome do projeto</Label>
          <Input
            id="projectName"
            value={model.projectName}
            onChange={(e) =>
              setModel({ ...model, projectName: e.target.value })
            }
            placeholder="Ex: PetConecta"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Paleta de cores</Label>
          <PalettePicker
            value={model.paletteId}
            onChange={(paletteId) => setModel({ ...model, paletteId })}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleDownload}>
          <Download className="size-4" /> Baixar HTML
        </Button>
        <Button variant="outline" onClick={handleOpenPreview}>
          <ExternalLink className="size-4" /> Abrir preview em nova aba
        </Button>
        <Button variant="outline" onClick={handleClear}>
          <RotateCcw className="size-4" /> Limpar rascunho
        </Button>
      </div>

      <EditableCanvas
        model={model}
        onEdit={(message) =>
          setModel((prev) => applyCanvasEdit(prev, message))
        }
      />
    </main>
  );
}
