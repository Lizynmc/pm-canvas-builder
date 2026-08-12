"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, GraduationCap, LayoutDashboard, PanelLeft, Code2 } from "lucide-react";
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
        "shrink-0 border-r bg-background transition-[width] duration-200",
        open ? "w-64" : "w-14",
      )}
    >
      <nav className="sticky top-0 flex h-screen flex-col gap-1 p-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Recolher menu" : "Expandir menu"}
          aria-expanded={open}
          title={open ? "Recolher menu" : "Expandir menu"}
          className="flex size-10 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <PanelLeft className="size-4" />
        </button>

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
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                open ? "" : "justify-center px-0",
                active
                  ? "bg-accent font-medium text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {open && <span className="truncate">{link.label}</span>}
            </Link>
          );
        })}

        {/* `mt-auto` gruda os links externos no rodapé do menu — o `h-screen`
            do <nav> é o que dá altura pra isso funcionar. */}
        <div className="mt-auto flex flex-col gap-1 border-t pt-2">
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
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground",
                  open ? "" : "justify-center px-0",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {open && <span className="truncate">{link.label}</span>}
              </a>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
