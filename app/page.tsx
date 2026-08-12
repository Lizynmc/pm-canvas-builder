"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Download, RotateCcw } from "lucide-react";
import { BLOCK_DEFINITIONS, emptyCanvasModel } from "@/lib/canvas-schema";
import { DEFAULT_PALETTE_ID } from "@/lib/palettes";
import { renderCanvasHtml } from "@/lib/render-canvas-html";
import { useDraft } from "@/lib/use-draft";
import { BlockEditor } from "@/components/canvas-form/block-editor";
import { PalettePicker } from "@/components/palette-picker";
import { PreviewFrame } from "@/components/preview-frame";
import { PrivacyBanner } from "@/components/privacy-banner";

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

  function handleClear() {
    clearDraft();
    toast.success("Rascunho limpo.");
  }

  return (
    <main className="grid lg:grid-cols-2 gap-6 p-6 max-w-[1600px] mx-auto w-full">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">PM Canvas Builder</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Preencha os 13 blocos do Project Model Canvas e baixe um HTML
            pronto, com a mesma identidade visual e as mesmas animações do
            modelo original.
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
            <Label htmlFor="footerMeta">Texto do rodapé</Label>
            <Input
              id="footerMeta"
              value={model.footerMeta}
              onChange={(e) =>
                setModel({ ...model, footerMeta: e.target.value })
              }
              placeholder="Ex: Fábrica de Software I · IFRO Vilhena · 2026/2"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Paleta de cores</Label>
          <PalettePicker
            value={model.paletteId}
            onChange={(paletteId) => setModel({ ...model, paletteId })}
          />
        </div>

        <Accordion multiple className="w-full">
          {BLOCK_DEFINITIONS.map((def) => (
            <AccordionItem key={def.id} value={def.id}>
              <AccordionTrigger>{def.title}</AccordionTrigger>
              <AccordionContent>
                <BlockEditor
                  def={def}
                  block={model.blocks[def.id]}
                  onChange={(block) =>
                    setModel({
                      ...model,
                      blocks: { ...model.blocks, [def.id]: block },
                    })
                  }
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="flex gap-2">
          <Button onClick={handleDownload}>
            <Download className="size-4" /> Baixar HTML
          </Button>
          <Button variant="outline" onClick={handleClear}>
            <RotateCcw className="size-4" /> Limpar rascunho
          </Button>
        </div>
      </div>

      <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
        <PreviewFrame model={model} />
      </div>
    </main>
  );
}
