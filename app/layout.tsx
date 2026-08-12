import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Link from "next/link";
import { Link2 } from "lucide-react";
import { Analytics } from "@vercel/analytics/next";
import { AppSidebar } from "@/components/app-sidebar";
import { LICENSE_NAME, LICENSE_URL } from "@/lib/project-links";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// TODO: colocar a URL do LinkedIn quando disponível.
const LINKEDIN_URL = "";

export const metadata: Metadata = {
  title: "PM Canvas Builder",
  description:
    "Monte um Project Model Canvas e exporte um HTML autocontido, com a mesma identidade visual e as mesmas animações do modelo original.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <div className="flex-1 flex">
          <AppSidebar />
          <div className="flex-1 min-w-0 flex flex-col">{children}</div>
        </div>
        <footer className="border-t px-6 py-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            PM Canvas Builder ·{" "}
            <Link
              href={LICENSE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors underline underline-offset-2"
            >
              Licença {LICENSE_NAME}
            </Link>
          </span>
          <div className="flex items-center gap-4">
            {LINKEDIN_URL ? (
              <Link
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
                aria-label="LinkedIn"
              >
                <Link2 className="size-4" />
                LinkedIn
              </Link>
            ) : null}
          </div>
        </footer>
        <Toaster />
        {/* Contagem de visita/página da Vercel. Não vê nada do que a pessoa
            preenche: o canvas continua vivendo só no navegador dela. */}
        <Analytics />
      </body>
    </html>
  );
}
