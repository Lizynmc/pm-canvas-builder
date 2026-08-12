"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ItemsEditor } from "@/components/items-editor";
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
  const mainGroup = block.groups[0] ?? { items: [{ text: "" }] };
  const extraGroups = block.groups.slice(1);
  const hasDetail = !!block.detail && block.detail.length > 0;
  const [showAdvanced, setShowAdvanced] = useState(
    extraGroups.length > 0 || hasDetail,
  );

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

      <ItemsEditor items={mainGroup.items} onChange={updateMainItems} />

      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronRight
            className={`size-4 transition-transform ${showAdvanced ? "rotate-90" : ""}`}
          />
          Opções avançadas (subgrupo com título, detalhamento completo)
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-3">
          <ListEditor groups={extraGroups} onChange={updateExtraGroups} />

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
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
