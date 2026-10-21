// Peças partilhadas pelos ecrãs das sugestões, do curso e da escolha registada.

import { AnimatePresence, motion } from "framer-motion";
import { Check, Clock, LoaderCircle } from "lucide-react";
import { useEffect, useRef } from "react";

const BOTAO =
  "flex h-[52px] items-center justify-center gap-2 whitespace-nowrap rounded-[10px] px-6 text-[16px] font-semibold transition-[background-color,color,transform] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";
export const BOTAO_PRINCIPAL = `${BOTAO} bg-primaria text-white hover:bg-primaria-escura`;
export const BOTAO_SECUNDARIO = `${BOTAO} border-[1.5px] border-primaria bg-white text-primaria hover:bg-primaria-clara`;

/** "Matemática e Física", "Português, História e Geografia". */
function juntar(lista) {
  if (lista.length <= 1) return lista.join("");
  return `${lista.slice(0, -1).join(", ")} e ${lista[lista.length - 1]}`;
}

/**
 * Frase curta para o cartão: as disciplinas importantes em que o aluno está
 * bem e quanto as respostas ao teste apontam para o perfil do curso.
 */
export function razaoCurta(rec, { terceiraPessoa = false } = {}) {
  // Só as 3 disciplinas que aparecem no cartão, para a frase bater com o que o aluno vê.
  const fortes = (rec.disciplinas_chave ?? [])
    .slice(0, 3)
    .filter((d) => d.tua_nota != null && d.tua_nota >= d.referencia - 1)
    .sort((a, b) => b.tua_nota - a.tua_nota)
    .slice(0, 2)
    .map((d) => d.disciplina);
  const notas = fortes.length ? `Boas notas em ${juntar(fortes)}` : "As tuas notas estão perto do que o curso pede";
  const p = rec.score_psicografico ?? 0;
  const respostas = terceiraPessoa ? "as respostas do aluno ao teste" : "as tuas respostas ao teste";
  if (p >= 0.4) return `${notas}, e combina com ${respostas}.`;
  if (p >= 0.2) return `${notas}, e combina em parte com ${respostas}.`;
  return `${notas}.`;
}

export function proximosPassos(rec) {
  const chave = (rec.disciplinas_chave ?? []).slice(0, 3).map((d) => d.disciplina);
  return [
    "Conversa com a tua família sobre esta escolha.",
    `Informa-te sobre as datas e os documentos de inscrição no ${rec.curso_instituicao}.`,
    chave.length
      ? `Continua a cuidar das notas de ${juntar(chave)}.`
      : "Se tiveres dúvidas, procura o orientador da tua escola.",
  ];
}

export function AvisoVinteQuatroHoras({ className = "" }) {
  return (
    <p className={`flex items-center justify-center gap-2 text-[13px] text-texto-suave ${className}`}>
      <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
      Os teus resultados ficam disponíveis neste dispositivo durante 24 horas.
    </p>
  );
}

/** Janela "Escolher {curso}?" (design Figma, Frame B). */
export function ConfirmarEscolha({ rec, aEscolher, erro, aoConfirmar, aoFechar }) {
  const painel = useRef(null);

  useEffect(() => {
    if (!rec) return undefined;
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => painel.current?.querySelector("[data-confirmar]")?.focus(), 30);
    const teclas = (e) => {
      if (e.key === "Escape" && !aEscolher) aoFechar();
      if (e.key !== "Tab" || !painel.current) return;
      const focaveis = [...painel.current.querySelectorAll("button:not([disabled])")];
      if (!focaveis.length) return;
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
  }, [rec, aEscolher, aoFechar]);

  return (
    <AnimatePresence>
      {rec && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-texto/40 backdrop-blur-[2px] sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={(e) => { if (e.target === e.currentTarget && !aEscolher) aoFechar(); }}
        >
          <motion.div
            ref={painel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirmar-titulo"
            aria-describedby="confirmar-texto"
            className="w-full rounded-t-[20px] bg-white px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-8 text-center sm:max-w-[520px] sm:rounded-[16px] sm:p-8"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
          >
            <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primaria-clara text-primaria">
              <Check className="h-7 w-7" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <h2 id="confirmar-titulo" className="mb-3 text-[24px] font-bold leading-snug">Escolher {rec.curso_nome}?</h2>
            <p id="confirmar-texto" className="mx-auto mb-7 max-w-[42ch] text-[15px] leading-relaxed text-texto-suave">
              {rec.curso_nome} — {rec.curso_instituicao}. A tua escolha fica registada e o orientador vai poder vê-la.
              Depois de confirmares, não a podes mudar.
            </p>
            {erro && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-[14px] text-red-700">{erro.message}</p>}
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button type="button" onClick={aoFechar} disabled={aEscolher} className={`${BOTAO_SECUNDARIO} sm:flex-1`}>
                Voltar
              </button>
              <button type="button" data-confirmar onClick={aoConfirmar} disabled={aEscolher} className={`${BOTAO_PRINCIPAL} sm:flex-[1.4]`}>
                {aEscolher && <LoaderCircle className="h-[18px] w-[18px] animate-spin" aria-hidden="true" />}
                {aEscolher ? "A registar…" : "Sim, escolher este curso"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** 0.873 → 87 */
export const percentagem = (v) => Math.round((v ?? 0) * 100);

/**
 * Compatibilidade do curso (score final do motor: 60% notas + 40% respostas)
 * num anel com a percentagem ao centro. Com `detalhe`, mostra também as duas
 * partes por baixo.
 */
export function Compatibilidade({ rec, tamanho = 76, detalhe = false, className = "" }) {
  const p = percentagem(rec.score_final);
  const r = 15.5;
  const perimetro = 2 * Math.PI * r;
  const grande = tamanho >= 110;
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: tamanho, height: tamanho }} role="img" aria-label={`${p}% de compatibilidade`}>
        <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="18" cy="18" r={r} fill="none" stroke="var(--color-primaria-clara)" strokeWidth="3.2" />
          <circle
            cx="18" cy="18" r={r} fill="none" stroke="var(--color-primaria)" strokeWidth="3.2" strokeLinecap="round"
            strokeDasharray={`${(p / 100) * perimetro} ${perimetro}`}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center font-bold tabular-nums text-primaria-escura ${grande ? "text-[30px]" : "text-[19px]"}`}>
          {p}%
        </span>
      </div>
      <span className={`mt-1.5 font-bold uppercase tracking-wide text-primaria ${grande ? "text-[12px]" : "text-[10.5px]"}`}>Compatível</span>
      {detalhe && (
        <dl className="mt-3 grid w-full min-w-[170px] grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-[13px]">
          <dt className="text-texto-suave">Notas (60%)</dt>
          <dd className="text-right font-semibold tabular-nums">{percentagem(rec.score_academico)}%</dd>
          <dt className="text-texto-suave">Respostas (40%)</dt>
          <dd className="text-right font-semibold tabular-nums">{percentagem(rec.score_psicografico)}%</dd>
        </dl>
      )}
    </div>
  );
}
