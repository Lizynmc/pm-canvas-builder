"use client";

import { useEffect, useState } from "react";
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
import {
  AlignLeft,
  Download,
  Eye,
  EyeOff,
  ExternalLink,
  ListTree,
  RotateCcw,
  X,
} from "lucide-react";
import { BLOCK_DEFINITIONS, emptyCanvasModel } from "@/lib/canvas-schema";
import { DEFAULT_PALETTE_ID } from "@/lib/palettes";
import type { FormMode } from "@/lib/form-mode";
import { renderCanvasHtml } from "@/lib/render-canvas-html";
import { useDraft } from "@/lib/use-draft";
import { BlockEditor } from "@/components/canvas-form/block-editor";
import { PalettePicker } from "@/components/palette-picker";
import { PreviewFrame } from "@/components/preview-frame";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Mesma coisa que a rota "/", por outro caminho: formulário + preview ao lado,
// em vez de editar direto no canvas. As duas escrevem no MESMO rascunho
// (`useDraft`, uma chave só no localStorage), então dá pra ir e voltar entre
// elas sem perder nada.
export default function CanvasFormPage() {
  const { model, setModel, clearDraft, restored } = useDraft(
    emptyCanvasModel(DEFAULT_PALETTE_ID),
  );
  const [formMode, setFormMode] = useState<FormMode>("simple");
  const [showPreview, setShowPreview] = useState(true);

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

  function handleOpenPreview() {
    // Abre o HTML de verdade (o mesmo que seria baixado) numa aba própria —
    // fora do iframe encolhido, dá pra testar tela cheia e zoom de verdade
    // antes de decidir baixar.
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
    <main
      className={`grid gap-6 p-6 max-w-[1600px] mx-auto w-full ${showPreview ? "lg:grid-cols-2" : "grid-cols-1"}`}
    >
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Preencher por formulário</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Um campo por vez, com o canvas ao lado. É o mesmo rascunho da
              edição direta no canvas — pode alternar entre as duas quando
              quiser.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => setShowPreview((v) => !v)}
          >
            {showPreview ? (
              <>
                <EyeOff className="size-4" /> Ocultar preview
              </>
            ) : (
              <>
                <Eye className="size-4" /> Mostrar preview
              </>
            )}
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
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

        <div className="space-y-1.5 rounded-md border p-3">
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={formMode === "simple" ? "default" : "outline"}
              onClick={() => setFormMode("simple")}
            >
              <AlignLeft className="size-4" /> Modo simples
            </Button>
            <Button
              type="button"
              size="sm"
              variant={formMode === "advanced" ? "default" : "outline"}
              onClick={() => setFormMode("advanced")}
            >
              <ListTree className="size-4" /> Modo completo
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {formMode === "simple"
              ? "Cole ou digite o texto de cada bloco — deixe uma linha em branco entre um item e outro. Dentro de um item você pode quebrar a linha à vontade, sem virar um item novo."
              : "Editor completo: um campo por item, sublista com título (ex: “Concorrentes”) e um detalhamento longo por bloco, que só aparece ao ampliar a seção."}
          </p>
        </div>

        {/* Lista única e numerada, na ordem do canvas. Já teve os títulos das
            colunas conceituais ("Passado → Futuro", "O quê"…) separando os
            blocos; o usuário mandou tirar, e o número faz o mesmo trabalho de
            situar quem preenche, com menos texto na tela. */}
        <Accordion multiple className="w-full">
          {BLOCK_DEFINITIONS.map((def, i) => (
            <AccordionItem key={def.id} value={def.id}>
              <AccordionTrigger>
                <span className="tabular-nums text-muted-foreground mr-2">
                  {i + 1}.
                </span>
                {def.title}
              </AccordionTrigger>
              <AccordionContent>
                <BlockEditor
                  def={def}
                  block={model.blocks[def.id]}
                  mode={formMode}
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

        {/* flex-wrap: em coluna estreita (grid de 2 colunas em telas médias) a
            linha sem quebra empurrava "Limpar rascunho" pra debaixo do preview. */}
        <div className="flex flex-wrap gap-2">
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

      {showPreview && (
        <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] flex flex-col gap-2">
          <div className="flex items-center justify-end shrink-0">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={handleOpenPreview}>
                <ExternalLink className="size-4" /> Tela cheia
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPreview(false)}
                aria-label="Fechar pré-visualização"
                title="Fechar pré-visualização"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <PreviewFrame model={model} />
          </div>
        </div>
      )}
    </main>
  );
}
