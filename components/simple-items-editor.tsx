"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import type { CanvasItem } from "@/lib/canvas-schema";

// Modo simples: cola-se o texto inteiro e cada PARÁGRAFO (bloco separado por
// uma linha em branco) vira um item da lista. Dentro de um parágrafo, quebras
// de linha são só formatação — as linhas são unidas com espaço, então um
// texto longo pode ocupar várias linhas sem virar vários itens.
// O texto bruto fica num estado local só pra não brigar com o cursor
// enquanto a pessoa digita — sincronizado com `items` de novo só quando o
// componente remonta (troca de modo, ou outro bloco).
export function SimpleItemsEditor({
  items,
  onChange,
}: {
  items: CanvasItem[];
  onChange: (items: CanvasItem[]) => void;
}) {
  const [text, setText] = useState(() =>
    items.map((item) => item.text).join("\n\n"),
  );

  function handleChange(value: string) {
    setText(value);
    const paragraphs = value
      .split(/\n\s*\n+/)
      .map((block) =>
        block
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .join(" "),
      )
      .filter((paragraph) => paragraph !== "");
    const nextItems = paragraphs.map((paragraphText, i) => ({
      text: paragraphText,
      pending: items[i]?.pending,
    }));
    onChange(nextItems.length > 0 ? nextItems : [{ text: "" }]);
  }

  return (
    <Textarea
      placeholder="Um item por parágrafo — deixe uma linha em branco entre eles."
      value={text}
      onChange={(e) => handleChange(e.target.value)}
      rows={7}
    />
  );
}
