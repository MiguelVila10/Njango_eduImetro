// Fundo do hero com várias fotografias que trocam por esbatimento suave.
// Só opacidade (sem zoom): ampliar uma foto grande enquanto se faz scroll
// pesa muito à placa gráfica e provocava saltos em computadores fracos.
// Não muda o layout: ocupa o mesmo espaço da imagem única que havia antes.
//
// - A primeira foto carrega logo; a seguinte é pré-carregada antes da troca.
// - Pára quando o separador não está visível (poupa bateria e dados).
// - Com "reduzir movimento" activo, fica só a primeira foto, parada.

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const DURACAO_MS = 6500;

function escolherSrc(foto) {
  // O mesmo critério do srcSet, para o pré-carregamento usar o ficheiro certo.
  return window.innerWidth <= 768 ? foto.pequena : foto.grande;
}

export default function SlideFundo({ fotos }) {
  const reduzir = useReducedMotion();
  const [atual, setAtual] = useState(0);

  useEffect(() => {
    if (reduzir || fotos.length < 2) return undefined;
    let temporizador;

    function agendar() {
      clearTimeout(temporizador);
      temporizador = setTimeout(() => {
        if (document.visibilityState !== "visible") return agendar();
        const seguinte = (atual + 1) % fotos.length;
        const img = new Image();
        img.src = escolherSrc(fotos[seguinte]);
        // Só troca quando a próxima foto já está carregada.
        img.decode().catch(() => {}).finally(() => setAtual(seguinte));
      }, DURACAO_MS);
    }

    agendar();
    const aoMudarVisibilidade = () => document.visibilityState === "visible" && agendar();
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    return () => {
      clearTimeout(temporizador);
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
    };
  }, [atual, fotos, reduzir]);

  const foto = fotos[atual];

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <AnimatePresence initial={false}>
        <motion.img
          key={foto.grande}
          src={foto.grande}
          srcSet={`${foto.pequena} 768w, ${foto.grande} 1376w`}
          sizes="100vw"
          alt=""
          fetchpriority={atual === 0 ? "high" : "auto"}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition: foto.posicao ?? "center" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 1.2, ease: "easeInOut" } }}
          exit={{ opacity: 0, transition: { duration: 1.2, ease: "easeInOut" } }}
        />
      </AnimatePresence>
    </div>
  );
}
