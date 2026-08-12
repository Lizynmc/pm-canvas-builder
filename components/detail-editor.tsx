"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";
import type { DetailSection } from "@/lib/canvas-schema";

export function DetailEditor({
  sections,
  onChange,
}: {
  sections: DetailSection[];
  onChange: (sections: DetailSection[]) => void;
}) {
  function updateSection(i: number, section: DetailSection) {
    onChange(sections.map((s, k) => (k === i ? section : s)));
  }

  function addSection() {
    onChange([...sections, { heading: "", entries: [{ text: "" }] }]);
  }

  function removeSection(i: number) {
    onChange(sections.filter((_, k) => k !== i));
  }

  return (
    <div className="space-y-4">
      {sections.map((section, si) => (
        <div key={si} className="space-y-3 rounded-md border p-3">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Título da seção, ex: Regras de Negócio"
              value={section.heading}
              onChange={(e) =>
                updateSection(si, { ...section, heading: e.target.value })
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeSection(si)}
              aria-label="Remover seção"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
          <Textarea
            placeholder="Nota introdutória (opcional)"
            value={section.intro ?? ""}
            onChange={(e) =>
              updateSection(si, { ...section, intro: e.target.value })
            }
            rows={2}
          />
          <div className="space-y-2">
            {section.entries.map((entry, ei) => (
              <div
                key={ei}
                className="grid grid-cols-[110px_1fr_auto] gap-2 items-start"
              >
                <Input
                  placeholder="Rótulo (ex: RN02)"
                  value={entry.label ?? ""}
                  onChange={(e) =>
                    updateSection(si, {
                      ...section,
                      entries: section.entries.map((en, k) =>
                        k === ei ? { ...en, label: e.target.value } : en,
                      ),
                    })
                  }
                />
                <div className="space-y-1">
                  <Textarea
                    placeholder="Texto do item"
                    value={entry.text}
                    onChange={(e) =>
                      updateSection(si, {
                        ...section,
                        entries: section.entries.map((en, k) =>
                          k === ei ? { ...en, text: e.target.value } : en,
                        ),
                      })
                    }
                    rows={2}
                  />
                  <Input
                    placeholder="Nota/ressalva (opcional)"
                    value={entry.note ?? ""}
                    onChange={(e) =>
                      updateSection(si, {
                        ...section,
                        entries: section.entries.map((en, k) =>
                          k === ei ? { ...en, note: e.target.value } : en,
                        ),
                      })
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    updateSection(si, {
                      ...section,
                      entries: section.entries.filter((_, k) => k !== ei),
                    })
                  }
                  aria-label="Remover entrada"
                  disabled={section.entries.length <= 1}
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
                updateSection(si, {
                  ...section,
                  entries: [...section.entries, { text: "" }],
                })
              }
            >
              <Plus className="size-4" /> Entrada
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addSection}>
        <Plus className="size-4" /> Seção de detalhamento
      </Button>
    </div>
  );
}
