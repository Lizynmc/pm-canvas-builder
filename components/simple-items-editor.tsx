"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import type { CanvasItem } from "@/lib/canvas-schema";

// Modo simples: cola-se o texto inteiro e cada linha vira um item da lista.
// Linhas em branco não têm efeito especial — são só espaçamento pra quem tá
// digitando/colando e nunca viram item (senão sobrariam campos vazios
// "fantasma" ao trocar pro modo avançado). O texto bruto (com as linhas em
// branco) fica num estado local só pra não brigar com o cursor enquanto a
// pessoa digita — sincronizado com `items` de novo só quando o componente
// remonta (troca de modo, ou outro bloco).
export function SimpleItemsEditor({
  items,
  onChange,
}: {
  items: CanvasItem[];
  onChange: (items: CanvasItem[]) => void;
}) {
  const [text, setText] = useState(() =>
    items.map((item) => item.text).join("\n"),
  );

  function handleChange(value: string) {
    setText(value);
    const withPending = value.split("\n").map((line, i) => ({
      text: line.trim(),
      pending: items[i]?.pending,
    }));
    const nonBlank = withPending.filter((item) => item.text !== "");
    onChange(nonBlank.length > 0 ? nonBlank : [{ text: "" }]);
  }

  return (
    <Textarea
      placeholder={
        "Um item por linha, ex:\nTutores não têm com quem deixar o pet ao viajar\nCombinação hoje é informal, por grupos de bairro"
      }
      value={text}
      onChange={(e) => handleChange(e.target.value)}
      rows={5}
    />
  );
}
