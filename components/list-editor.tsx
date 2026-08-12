"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import type { CanvasGroup } from "@/lib/canvas-schema";

export function ListEditor({
  groups,
  onChange,
}: {
  groups: CanvasGroup[];
  onChange: (groups: CanvasGroup[]) => void;
}) {
  function updateGroup(index: number, group: CanvasGroup) {
    onChange(groups.map((g, i) => (i === index ? group : g)));
  }

  function addGroup() {
    onChange([...groups, { label: "", items: [{ text: "" }] }]);
  }

  function removeGroup(index: number) {
    onChange(groups.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      {groups.map((group, gi) => (
        <div key={gi} className="space-y-3 rounded-md border p-3">
          <div className="flex items-center gap-2">
            <Input
              placeholder={
                gi === 0
                  ? "Sem subtítulo (lista principal)"
                  : "Subtítulo do grupo, ex: Concorrentes"
              }
              value={group.label ?? ""}
              onChange={(e) =>
                updateGroup(gi, { ...group, label: e.target.value })
              }
            />
            {groups.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeGroup(gi)}
                aria-label="Remover grupo"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {group.items.map((item, ii) => (
              <div key={ii} className="flex items-center gap-2">
                <Input
                  placeholder="Item"
                  value={item.text}
                  onChange={(e) =>
                    updateGroup(gi, {
                      ...group,
                      items: group.items.map((it, k) =>
                        k === ii ? { ...it, text: e.target.value } : it,
                      ),
                    })
                  }
                />
                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                  <Switch
                    checked={!!item.pending}
                    onCheckedChange={(checked) =>
                      updateGroup(gi, {
                        ...group,
                        items: group.items.map((it, k) =>
                          k === ii ? { ...it, pending: checked } : it,
                        ),
                      })
                    }
                  />
                  Em aberto
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    updateGroup(gi, {
                      ...group,
                      items: group.items.filter((_, k) => k !== ii),
                    })
                  }
                  aria-label="Remover item"
                  disabled={group.items.length <= 1}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                updateGroup(gi, {
                  ...group,
                  items: [...group.items, { text: "" }],
                })
              }
            >
              <Plus className="size-4" /> Item
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addGroup}>
        <Plus className="size-4" /> Subgrupo com subtítulo
      </Button>
    </div>
  );
}
