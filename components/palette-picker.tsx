"use client";

import { PALETTES } from "@/lib/palettes";
import { cn } from "@/lib/utils";

export function PalettePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {PALETTES.map((palette) => (
        <button
          key={palette.id}
          type="button"
          onClick={() => onChange(palette.id)}
          aria-pressed={value === palette.id}
          className={cn(
            "flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
            value === palette.id
              ? "border-foreground"
              : "border-border hover:border-foreground/50",
          )}
        >
          <span className="flex -space-x-1.5">
            <span
              className="size-4 rounded-full border border-white"
              style={{ background: palette.accent }}
            />
            <span
              className="size-4 rounded-full border border-white"
              style={{ background: palette.accentDark }}
            />
          </span>
          {palette.name}
        </button>
      ))}
    </div>
  );
}
