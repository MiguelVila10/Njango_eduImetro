// Janela para escolher a nota sem escrever: abre com toque duplo (ou duplo
// clique) numa caixa de nota e mostra os botões de 10 a 20.
// No telemóvel sobe de baixo; no computador aparece ao centro.

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

import { NOTA_MAX, NOTA_MIN } from "../api/aluno";

const NOTAS = Array.from({ length: NOTA_MAX - NOTA_MIN + 1 }, (_, i) => String(NOTA_MIN + i));

export default function EscolherNota({ disciplina, valor, aoEscolher, aoFechar }) {
  const aberta = Boolean(disciplina);
  const painel = useRef(null);
  // Só fecha ao tocar no fundo se o toque também começou no fundo. Assim o
  // "click" que o telemóvel envia depois do toque duplo não fecha a janela.
  const comecouNoFundo = useRef(false);

  // Foco no botão da nota actual (ou no primeiro), Esc fecha, Tab fica dentro.
  useEffect(() => {
    if (!aberta) return undefined;
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => {
      const alvo = painel.current?.querySelector('[aria-pressed="true"]') ?? painel.current?.querySelector("[data-nota]");
      alvo?.focus();
    }, 30);
    const teclas = (e) => {
      if (e.key === "Escape") aoFechar();
      if (e.key !== "Tab" || !painel.current) return;
      const focaveis = [...painel.current.querySelectorAll("button")];
      const [primeiro, ultimo] = [focaveis[0], focaveis[focaveis.length - 1]];
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    };
    document.addEventListener("keydown", teclas);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = antes;
      document.removeEventListener("keydown", teclas);
    };
  }, [aberta, aoFechar]);

  return (
    <AnimatePresence>
      {aberta && (
        <motion.div
          key="fundo"
          className="fixed inset-0 z-50 flex items-end justify-center bg-texto/40 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onPointerDown={(e) => { comecouNoFundo.current = e.target === e.currentTarget; }}
          onClick={(e) => { if (comecouNoFundo.current && e.target === e.currentTarget) aoFechar(); }}
        >
          <motion.div
            ref={painel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="escolher-nota-titulo"
            className="w-full rounded-t-[20px] bg-white px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_32px_rgba(37,43,66,0.18)] sm:max-w-[440px] sm:rounded-[16px] sm:p-6"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
          >
            <span aria-hidden="true" className="mx-auto mb-3 block h-1 w-10 rounded-full bg-borda sm:hidden" />
            <div className="mb-1 flex items-start justify-between gap-4">
              <h2 id="escolher-nota-titulo" className="text-[20px] font-bold leading-7">
                Nota de {disciplina}
              </h2>
              <button
                type="button"
                onClick={aoFechar}
                aria-label="Fechar"
                className="-mr-2 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-texto-suave hover:bg-fundo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <p className="mb-4 text-[14px] text-texto-suave">Toca na nota que aparece no teu boletim.</p>

            <div className="grid grid-cols-4 gap-2.5">
              {NOTAS.map((n) => {
                const escolhida = n === valor;
                return (
                  <button
                    key={n}
                    type="button"
                    data-nota={n}
                    aria-pressed={escolhida}
                    onClick={() => aoEscolher(n)}
                    className={`h-14 rounded-[12px] border-[1.5px] text-[20px] font-bold tabular-nums transition-[background-color,border-color,color,transform] active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primaria/25 ${
                      escolhida
                        ? "border-primaria bg-primaria text-white"
                        : "border-borda bg-white text-texto hover:border-primaria hover:bg-primaria-clara"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
