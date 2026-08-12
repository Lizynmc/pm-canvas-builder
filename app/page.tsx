"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Download, ExternalLink, RotateCcw, Share2 } from "lucide-react";
import { emptyCanvasModel } from "@/lib/canvas-schema";
import { DEFAULT_PALETTE_ID, getPalette } from "@/lib/palettes";
import { renderCanvasHtml } from "@/lib/render-canvas-html";
import { GENERATOR_URL, shareMessage } from "@/lib/project-links";
import { useDraft } from "@/lib/use-draft";
import { useAdvancedMode } from "@/lib/use-advanced-mode";
import { applyCanvasEdit } from "@/lib/apply-canvas-edit";
import { PalettePicker } from "@/components/palette-picker";
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
  const { advanced, toggleAdvanced } = useAdvancedMode();

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

  async function handleCopyLink() {
    // GENERATOR_URL só existe depois do deploy; até lá, o link é o endereço
    // em que a pessoa está agora.
    const url = GENERATOR_URL || window.location.origin;
    try {
      await navigator.clipboard.writeText(shareMessage(url));
      toast.success("Link copiado, com o texto de divulgação junto.");
    } catch {
      toast.error("Seu navegador não deixou copiar. Copie o endereço da barra.");
    }
  }

  return (
    <main className="max-w-[1800px] mx-auto w-full p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">PM Canvas Builder</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Edite direto no canvas abaixo: clique em qualquer item pra escrever,
            passe o mouse pra ver os controles de remover e marcar como
            pendente (●), e use o botão &quot;+ item&quot; no fim de cada lista.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={handleCopyLink}
        >
          <Share2 className="size-4" /> Compartilhar
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="projectName">Nome do projeto</Label>
          <Input
            id="projectName"
            value={model.projectName}
            onChange={(e) =>
              setModel({ ...model, projectName: e.target.value })
            }
            placeholder="Como o projeto se chama"
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

      <div className="flex items-start gap-3 rounded-md border p-4">
        <Switch
          id="modoCompleto"
          checked={advanced}
          onCheckedChange={toggleAdvanced}
        />
        <div className="space-y-1">
          <Label htmlFor="modoCompleto" className="cursor-pointer">
            Modo completo
          </Label>
          <p className="text-muted-foreground text-sm">
            {advanced
              ? "Sublistas com título (+ sublista) já dá pra criar aqui no canvas. O detalhamento longo fica no modo de visualização: clique no título de um bloco pra ampliá-lo e escrever lá — esse texto aparece só na ampliação, nunca no canvas."
              : "Só a lista principal de cada bloco é editável. Ligue pra preencher também as sublistas com título e o detalhamento de cada bloco."}
          </p>
        </div>
      </div>

      {/* O canvas e os botões dividem o mesmo fundo: o iframe já pinta o
          `pageBg` da paleta, então repetir a cor aqui faz a emenda sumir e os
          botões parecerem parte da folha, embaixo dela. */}
      <div
        className="rounded-md border p-4 space-y-4"
        style={{ background: getPalette(model.paletteId).pageBg }}
      >
        <EditableCanvas
          model={model}
          advanced={advanced}
          onEdit={(message) =>
            setModel((prev) => applyCanvasEdit(prev, message))
          }
        />

        <div className="flex flex-wrap justify-center gap-2">
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
      </div>
    </main>
  );
}
