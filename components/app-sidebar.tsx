"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  GraduationCap,
  LayoutDashboard,
  PanelLeft,
  Code2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AUTHOR_GITHUB_URL, LATTES_URL } from "@/lib/project-links";

// Duas formas de preencher o mesmo rascunho (o `localStorage` é compartilhado
// pelas duas rotas): direto no canvas ou por formulário. O menu recolhe pra
// não roubar largura de quem já sabe onde está.
const LINKS = [
  { href: "/", label: "Editar no canvas", icon: LayoutDashboard },
  { href: "/canvas-form", label: "Preencher por formulário", icon: FileText },
];

// Perfil, não repositório: o repo é privado e vai continuar assim.
const EXTERNAL_LINKS = [
  { href: AUTHOR_GITHUB_URL, label: "GitHub", icon: Code2 },
  { href: LATTES_URL, label: "Lattes", icon: GraduationCap },
];

export function AppSidebar() {
  const [open, setOpen] = useState(true);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "shrink-0 border-r border-border/60 bg-muted/20",
        "transition-[width] duration-300 ease-out",
        open ? "w-60" : "w-17",
      )}
    >
      <div className="sticky top-0 flex h-screen flex-col gap-6 px-3 py-4">
        {/* Marca + recolher. Com o menu fechado, o ícone da marca some pra o
            botão não brigar por espaço com ele. */}
        <div
          className={cn(
            "flex items-center gap-2",
            open ? "justify-between" : "justify-center",
          )}
        >
          {open && (
            <span className="flex items-center gap-2 overflow-hidden">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
                <LayoutDashboard className="size-4" />
              </span>
              <span className="truncate text-sm font-semibold tracking-tight">
                PM Canvas
              </span>
            </span>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Recolher menu" : "Expandir menu"}
            aria-expanded={open}
            title={open ? "Recolher menu" : "Expandir menu"}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-200 hover:bg-foreground/5 hover:text-foreground"
          >
            <PanelLeft
              className={cn(
                "size-4 transition-transform duration-300 ease-out",
                open ? "" : "rotate-180",
              )}
            />
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {LINKS.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                title={open ? undefined : link.label}
                className={cn(
                  "group relative flex h-11 items-center gap-3 rounded-xl text-sm transition-colors duration-200",
                  open ? "px-3" : "justify-center px-0",
                  active
                    ? "bg-foreground/6 font-medium text-foreground"
                    : "text-muted-foreground hover:bg-foreground/3 hover:text-foreground",
                )}
              >
                {/* Marcador do item ativo: uma barrinha que cresce, em vez de
                    trocar a cor do bloco inteiro. */}
                <span
                  className={cn(
                    "absolute left-0 w-0.75 rounded-r-full bg-foreground transition-all duration-300 ease-out",
                    active ? "h-5 opacity-100" : "h-0 opacity-0",
                  )}
                />
                <Icon className="size-4.5 shrink-0" />
                {open && <span className="truncate">{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* `mt-auto` gruda os links externos no rodapé do menu — o `h-screen`
            do contêiner é o que dá altura pra isso funcionar. */}
        <div className="mt-auto flex flex-col gap-0.5">
          {EXTERNAL_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                title={open ? undefined : link.label}
                className={cn(
                  "flex h-9 items-center gap-3 rounded-lg text-[13px] text-muted-foreground transition-colors duration-200 hover:bg-foreground/3 hover:text-foreground",
                  open ? "px-3" : "justify-center px-0",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {open && <span className="truncate">{link.label}</span>}
              </a>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
