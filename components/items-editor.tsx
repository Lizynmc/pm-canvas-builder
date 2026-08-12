"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import type { CanvasItem } from "@/lib/canvas-schema";

export function ItemsEditor({
  items,
  onChange,
}: {
  items: CanvasItem[];
  onChange: (items: CanvasItem[]) => void;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            placeholder="Item"
            value={item.text}
            onChange={(e) =>
              onChange(
                items.map((it, k) =>
                  k === i ? { ...it, text: e.target.value } : it,
                ),
              )
            }
          />
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
            <Switch
              checked={!!item.pending}
              onCheckedChange={(checked) =>
                onChange(
                  items.map((it, k) =>
                    k === i ? { ...it, pending: checked } : it,
                  ),
                )
              }
            />
            Em aberto
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onChange(items.filter((_, k) => k !== i))}
            aria-label="Remover item"
            disabled={items.length <= 1}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...items, { text: "" }])}
      >
        <Plus className="size-4" /> Item
      </Button>
    </div>
  );
}
