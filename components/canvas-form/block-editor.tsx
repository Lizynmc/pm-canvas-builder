"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ItemsEditor } from "@/components/items-editor";
import { SimpleItemsEditor } from "@/components/simple-items-editor";
import { ListEditor } from "@/components/list-editor";
import { DetailEditor } from "@/components/detail-editor";
import type { BlockDefinition, CanvasBlock } from "@/lib/canvas-schema";
import type { FormMode } from "@/lib/form-mode";

export function BlockEditor({
  def,
  block,
  mode,
  onChange,
}: {
  def: BlockDefinition;
  block: CanvasBlock;
  mode: FormMode;
  onChange: (block: CanvasBlock) => void;
}) {
  const mainGroup = block.groups[0] ?? { items: [{ text: "" }] };
  const extraGroups = block.groups.slice(1);
  const hasDetail = !!block.detail && block.detail.length > 0;
  const hasAdvancedContent = extraGroups.length > 0 || hasDetail;

  function updateMainItems(items: typeof mainGroup.items) {
    onChange({ ...block, groups: [{ ...mainGroup, items }, ...extraGroups] });
  }

  function updateExtraGroups(groups: typeof extraGroups) {
    onChange({ ...block, groups: [mainGroup, ...groups] });
  }

  function toggleDetail(enabled: boolean) {
    if (enabled) {
      onChange({
        ...block,
        detail: block.detail?.length
          ? block.detail
          : [{ heading: "", entries: [{ text: "" }] }],
      });
    } else {
      onChange({ ...block, detail: undefined });
    }
  }

  return (
    <div className="space-y-4">
      {!def.fixedSubtitle && (
        <div className="space-y-1.5">
          <Label htmlFor={`subtitle-${def.id}`}>Subtítulo (opcional)</Label>
          <Input
            id={`subtitle-${def.id}`}
            placeholder='Ex: "21 encontros · terças · 4h"'
            value={block.subtitle ?? ""}
            onChange={(e) => onChange({ ...block, subtitle: e.target.value })}
          />
        </div>
      )}

      {mode === "simple" ? (
        <>
          <SimpleItemsEditor
            items={mainGroup.items}
            onChange={updateMainItems}
          />
          {hasAdvancedContent && (
            <p className="text-xs text-muted-foreground">
              Este bloco também tem subgrupo com título ou detalhamento
              completo preenchido — mude pro modo avançado pra ver ou editar.
            </p>
          )}
        </>
      ) : (
        <>
          <ItemsEditor items={mainGroup.items} onChange={updateMainItems} />

          <Separator />

          <ListEditor groups={extraGroups} onChange={updateExtraGroups} />

          <div className="flex items-center gap-2">
            <Switch
              checked={hasDetail}
              onCheckedChange={toggleDetail}
              id={`detail-${def.id}`}
            />
            <Label htmlFor={`detail-${def.id}`}>
              Adicionar detalhamento completo (aparece só ao ampliar a seção)
            </Label>
          </div>
          {hasDetail && (
            <DetailEditor
              sections={block.detail ?? []}
              onChange={(detail) => onChange({ ...block, detail })}
            />
          )}

          {def.fullTextTab && (
            <div className="space-y-1.5">
              <Label htmlFor={`fulltext-${def.id}`}>
                {def.fullTextTab} — aparece só ao ampliar a seção, numa aba
                própria (nunca no canvas)
              </Label>
              <Textarea
                id={`fulltext-${def.id}`}
                rows={8}
                placeholder="Cole aqui o texto completo — pode ser do tamanho que precisar."
                value={block.fullText ?? ""}
                onChange={(e) =>
                  onChange({ ...block, fullText: e.target.value })
                }
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
