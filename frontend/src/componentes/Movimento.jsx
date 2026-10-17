// Animações discretas partilhadas pelas páginas. Não mudam o layout: só a
// forma como os elementos aparecem e reagem. Com "reduzir movimento" activo
// no sistema, o MotionConfig (main.jsx) desliga as deslocações.

import { animate, motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export const SUAVE = [0.22, 1, 0.36, 1]; // curva "ease-out" suave

/**
 * Aparece com um esbatimento suave quando entra no ecrã (uma só vez).
 * Só mexe na opacidade: é a propriedade mais leve de animar, por isso não
 * dá "saltos" durante o scroll, nem em telemóveis fracos.
 */
export function Revelar({ como = "div", atraso = 0, children, ...props }) {
  const Componente = motion[como];
  return (
    <Componente
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.3, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.7, delay: atraso, ease: "easeOut" }}
      {...props}
    >
      {children}
    </Componente>
  );
}

/**
 * Grelha de cartões: um único observador para a grelha toda, e os cartões
 * aparecem em cascata (só opacidade). O "subir ao passar o rato" fica no CSS
 * dos cartões, que assim não entra em conflito com a animação.
 */
export const grelha = {
  initial: "escondido",
  whileInView: "visivel",
  viewport: { once: true, amount: 0.2, margin: "0px 0px -10% 0px" },
  variants: { escondido: {}, visivel: { transition: { staggerChildren: 0.09 } } },
};

export const itemGrelha = {
  variants: {
    escondido: { opacity: 0 },
    visivel: { opacity: 1, transition: { duration: 0.6, ease: "easeOut" } },
  },
};

/** Classes de "subir ao passar o rato" (só com rato e sem reduzir movimento). */
export const SUBIR_HOVER =
  "transition-[translate,box-shadow,border-color] duration-300 ease-out motion-safe:[@media(hover:hover)]:hover:-translate-y-1";

/** Número que conta de 0 até ao valor quando aparece no ecrã. */
export function Contador({ valor }) {
  const ref = useRef(null);
  const visivel = useInView(ref, { once: true });
  const [mostrado, setMostrado] = useState(valor);

  useEffect(() => {
    if (!visivel) return undefined;
    const reduzir = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduzir) {
      setMostrado(valor);
      return undefined;
    }
    const controlo = animate(0, valor, {
      duration: 0.9,
      ease: SUAVE,
      onUpdate: (v) => setMostrado(Math.round(v)),
    });
    return () => controlo.stop();
  }, [visivel, valor]);

  return <span ref={ref} className="tabular-nums">{mostrado}</span>;
}
