import { ShieldCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function PrivacyBanner() {
  return (
    <Alert>
      <ShieldCheck />
      <AlertTitle>Nada do que você preenche aqui é salvo em servidor</AlertTitle>
      <AlertDescription>
        Tudo roda no seu navegador. Um rascunho fica guardado só localmente
        (localStorage) pra você não perder o preenchimento com um refresh
        acidental — mas nada é enviado pra nenhum servidor, e não guardamos
        modelos prontos. Baixar o HTML é a única forma de guardar o resultado.
      </AlertDescription>
    </Alert>
  );
}
