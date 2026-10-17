// Animações discretas partilhadas pelas páginas. Não mudam o layout: só a
// forma como os elementos aparecem e reagem. Com "reduzir movimento" activo
// no sistema, o MotionConfig (main.jsx) desliga as deslocações.

import { animate, motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export const SUAVE = [0.22, 1, 0.36, 1]; // curva "ease-out" suave

/** Aparece a subir ligeiramente quando entra no ecrã (uma só vez). */
export function Revelar({ como = "div", atraso = 0, children, ...props }) {
  const Componente = motion[como];
  return (
    <Componente
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.5, delay: atraso, ease: SUAVE }}
      {...props}
    >
      {children}
    </Componente>
  );
}

/** Propriedades para cartões: entram em cascata e sobem 4 px ao passar o rato. */
export function cartao(indice = 0) {
  return {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    whileHover: { y: -4 },
    transition: { duration: 0.45, delay: indice * 0.08, ease: SUAVE },
  };
}

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
