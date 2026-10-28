// Logótipo do Njango Edu (livro com o N e a seta de orientação).
// "compacto" = ícone + nome, para cabeçalhos; "completo" = com o subtítulo.
// Em fundos escuros usa-se a versão branca.

import compacto from "../assets/marca/logo-compacto.svg";
import compactoBranco from "../assets/marca/logo-compacto-branco.svg";
import completo from "../assets/marca/logo-completo.svg";
import completoBranco from "../assets/marca/logo-completo-branco.svg";

const FICHEIROS = {
  compacto: { normal: compacto, branco: compactoBranco },
  completo: { normal: completo, branco: completoBranco },
};

export default function Marca({ versao = "compacto", branco = false, className = "h-10" }) {
  const src = FICHEIROS[versao][branco ? "branco" : "normal"];
  return <img src={src} alt="Njango Edu" className={`w-auto select-none ${className}`} draggable="false" />;
}
