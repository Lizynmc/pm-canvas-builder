"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { ItemsEditor } from "@/components/items-editor";
import type { CanvasGroup } from "@/lib/canvas-schema";

// Editor dos subgrupos com título (ex: "Concorrentes" em Stakeholders,
// "Papéis" em Equipe). A lista principal do bloco (sem título) é editada
// por ItemsEditor direto no BlockEditor — aqui só entram os extras.
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
              placeholder="Título do subgrupo, ex: Concorrentes"
              value={group.label ?? ""}
              onChange={(e) =>
                updateGroup(gi, { ...group, label: e.target.value })
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeGroup(gi)}
              aria-label="Remover subgrupo"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
          <ItemsEditor
            items={group.items}
            onChange={(items) => updateGroup(gi, { ...group, items })}
          />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addGroup}>
        <Plus className="size-4" /> Subgrupo com título
      </Button>
    </div>
  );
}
