import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Link from "next/link";
import { Link2 } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// TODO: colocar a URL do LinkedIn quando disponível.
const LINKEDIN_URL = "";
const GITHUB_URL = "https://github.com/Lizynmc";

export const metadata: Metadata = {
  title: "PM Canvas Builder",
  description:
    "Monte um Project Model Canvas e exporte um HTML autocontido, com a mesma identidade visual e as mesmas animações do modelo original.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <div className="flex-1 flex flex-col">{children}</div>
        <footer className="border-t px-6 py-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>PM Canvas Builder</span>
          <div className="flex items-center gap-4">
            <Link
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <Link2 className="size-4" />
              GitHub
            </Link>
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
      </body>
    </html>
  );
}
