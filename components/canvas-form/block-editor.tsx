"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ListEditor } from "@/components/list-editor";
import { DetailEditor } from "@/components/detail-editor";
import type { BlockDefinition, CanvasBlock } from "@/lib/canvas-schema";

export function BlockEditor({
  def,
  block,
  onChange,
}: {
  def: BlockDefinition;
  block: CanvasBlock;
  onChange: (block: CanvasBlock) => void;
}) {
  const hasDetail = !!block.detail && block.detail.length > 0;

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

      <ListEditor
        groups={block.groups}
        onChange={(groups) => onChange({ ...block, groups })}
      />

      <Separator />

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
    </div>
  );
}
