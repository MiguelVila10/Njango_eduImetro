// Teste adaptativo (CAT), no mesmo estilo do ecrã das notas.
// Uma pergunta de cada vez: o aluno escolhe uma opção e carrega em "Seguinte".
// O servidor decide a pergunta seguinte e quando o teste acaba (5 a 15 perguntas).
// O tempo de resposta conta até à escolha, não até ao toque em "Seguinte".

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CircleCheck, Lightbulb, RefreshCw, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { MAX_PERGUNTAS } from "../../api/aluno";
import CabecalhoPercurso from "../../componentes/CabecalhoPercurso";
import { useTeste } from "../../hooks/useTeste";
import { sessaoAluno } from "../../sessao/sessaoAluno";

const BOTAO_PRINCIPAL =
  "flex h-14 items-center justify-center gap-2 rounded-[14px] bg-primaria px-8 text-[16px] font-semibold text-white transition-[background-color,transform] hover:bg-primaria-escura active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-borda disabled:text-texto-suave sm:rounded-[8px]";
const BOTAO_SECUNDARIO =
  "flex h-14 items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-primaria px-8 text-[16px] font-semibold text-primaria transition-colors hover:bg-primaria-clara disabled:cursor-not-allowed disabled:opacity-60 sm:rounded-[8px]";

function Opcao({ opcao, escolhida, desactivada, aoEscolher }) {
  const id = `opcao-${opcao.posicao}`;
  return (
    <label
      htmlFor={id}
      className={`group flex cursor-pointer items-start gap-4 rounded-[12px] border-[1.5px] bg-white p-4 transition-[border-color,background-color,box-shadow] md:p-5 ${
        escolhida ? "border-primaria bg-primaria-clara shadow-[0_0_0_3px_rgba(31,111,192,0.12)]" : "border-borda hover:border-primaria/60"
      } ${desactivada ? "pointer-events-none opacity-70" : ""}`}
    >
      <input
        id={id}
        type="radio"
        name="opcao"
        value={opcao.posicao}
        checked={escolhida}
        disabled={desactivada}
        onChange={() => aoEscolher(opcao)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[14px] font-bold transition-colors peer-focus-visible:ring-4 peer-focus-visible:ring-primaria/30 ${
          escolhida ? "bg-primaria text-white" : "bg-fundo text-texto-suave group-hover:text-primaria"
        }`}
      >
        {opcao.posicao}
      </span>
      <span className="pt-1 text-[16px] font-medium leading-snug">{opcao.texto}</span>
    </label>
  );
}

function Cartao({ children }) {
  return (
    <div className="mx-auto w-full max-w-[640px] rounded-[16px] border-[1.5px] border-borda bg-white p-6 text-center shadow-sm md:p-10">
      {children}
    </div>
  );
}

export default function Teste() {
  const navegar = useNavigate();
  const { alunoId } = sessaoAluno();
  const { estado, carregando, aEnviar, erro, responder, repetir, recarregar, tempoDecorrido } = useTeste(alunoId);
  const [escolha, setEscolha] = useState(null); // { opcao, tempoMs }
  const titulo = useRef(null);

  const item = estado?.item;
  const numero = (estado?.respondidas ?? 0) + 1;
  const percentagem = Math.min(100, Math.round(((estado?.respondidas ?? 0) / MAX_PERGUNTAS) * 100));

  // Nova pergunta: limpa a escolha, volta ao topo e põe o foco no enunciado.
  useEffect(() => {
    if (!item) return;
    setEscolha(null);
    window.scrollTo({ top: 0 });
    titulo.current?.focus({ preventScroll: true });
  }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function escolher(opcao) {
    setEscolha({ opcao, tempoMs: tempoDecorrido() });
  }

  function seguinte() {
    if (escolha && !aEnviar) responder(escolha.opcao, escolha.tempoMs);
  }

  const detalhe = item ? `Pergunta ${numero} · no máximo ${MAX_PERGUNTAS}` : null;

  let conteudo;
  if (carregando) {
    conteudo = (
      <div className="mx-auto w-full max-w-[760px] animate-pulse" aria-live="polite">
        <span className="sr-only">A carregar a pergunta…</span>
        <div className="mb-3 h-4 w-32 rounded bg-borda" />
        <div className="mb-2 h-7 w-full rounded bg-borda" />
        <div className="mb-8 h-7 w-2/3 rounded bg-borda" />
        {[0, 1, 2, 3].map((i) => <div key={i} className="mb-3 h-16 rounded-[12px] bg-borda/70" />)}
      </div>
    );
  } else if (!estado) {
    conteudo = (
      <Cartao>
        <h1 className="mb-2 text-[24px] font-bold">Não foi possível carregar a pergunta</h1>
        <p className="mb-6 text-texto-suave">{erro?.message ?? "Verifica a ligação e tenta de novo."}</p>
        <button type="button" onClick={recarregar} className={`${BOTAO_PRINCIPAL} mx-auto w-full sm:w-auto`}>
          <RefreshCw className="h-[18px] w-[18px]" aria-hidden="true" /> Tentar de novo
        </button>
      </Cartao>
    );
  } else if (estado.terminado) {
    conteudo = estado.pode_repetir ? (
      <Cartao>
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primaria-clara text-primaria">
          <RotateCcw className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mb-3 text-[24px] font-bold leading-8 md:text-[28px]">Terminaste o teste</h1>
        <p className="mx-auto mb-2 max-w-[48ch] text-[16px] leading-relaxed text-texto-suave">
          Algumas respostas foram muito rápidas ou pouco parecidas entre si. Se quiseres, podes responder outra
          vez, com mais calma, para as sugestões ficarem mais certas.
        </p>
        <p className="mb-8 text-[14px] font-semibold text-texto-suave">Só é possível repetir uma vez.</p>
        {erro && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-[14px] text-red-700">{erro.message}</p>}
        <div className="flex flex-col-reverse justify-center gap-3 sm:flex-row">
          <button type="button" onClick={() => navegar("/aluno/resultado")} className={BOTAO_SECUNDARIO}>
            Ver os cursos sugeridos
          </button>
          <button type="button" onClick={repetir} disabled={aEnviar} className={BOTAO_PRINCIPAL}>
            {aEnviar ? "A preparar…" : "Responder outra vez"}
          </button>
        </div>
      </Cartao>
    ) : (
      <Cartao>
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <CircleCheck className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="mb-3 text-[24px] font-bold leading-8 md:text-[28px]">Terminaste o teste</h1>
        <p className="mx-auto mb-8 max-w-[44ch] text-[16px] leading-relaxed text-texto-suave">
          Respondeste a {estado.respondidas} perguntas. Agora vamos juntar as tuas notas e as tuas respostas para
          ver os cursos que combinam contigo.
        </p>
        <button type="button" onClick={() => navegar("/aluno/resultado")} className={`${BOTAO_PRINCIPAL} mx-auto w-full sm:w-auto`}>
          Ver os cursos sugeridos <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>
      </Cartao>
    );
  } else {
    conteudo = (
      <div className="mx-auto w-full max-w-[760px]">
        {numero === 1 && estado.tentativa === 1 && (
          <div className="mb-6 flex items-start gap-3.5 rounded-[8px] border border-primaria/20 bg-primaria-clara p-4 md:mb-8">
            <Lightbulb className="mt-0.5 h-6 w-6 shrink-0 text-primaria-escura" strokeWidth={1.8} aria-hidden="true" />
            <p className="text-[14px] font-medium leading-relaxed">
              Não há respostas certas nem erradas. Escolhe o que farias de verdade, não o que achas que esperam de ti.
            </p>
          </div>
        )}

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <p className="mb-2 flex items-center gap-2 text-[14px] font-semibold text-primaria">
              Pergunta {numero}
              {estado.tentativa > 1 && (
                <span className="rounded-full bg-fundo px-2.5 py-0.5 text-[12px] font-semibold text-texto-suave ring-1 ring-borda">
                  2.ª tentativa
                </span>
              )}
            </p>
            <h1
              ref={titulo}
              tabIndex={-1}
              id="enunciado"
              className="mb-6 text-[20px] font-bold leading-[1.45] tracking-tight outline-none md:mb-8 md:text-[24px]"
            >
              {item.texto}
            </h1>

            <fieldset aria-labelledby="enunciado" className="flex flex-col gap-3">
              {item.opcoes.map((o) => (
                <Opcao
                  key={o.posicao}
                  opcao={o}
                  escolhida={escolha?.opcao.posicao === o.posicao}
                  desactivada={aEnviar}
                  aoEscolher={escolher}
                />
              ))}
            </fieldset>
          </motion.div>
        </AnimatePresence>

        {erro && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-[14px] text-red-700">{erro.message}</p>}
      </div>
    );
  }

  const aResponder = Boolean(item) && !estado?.terminado;

  return (
    <div className="min-h-screen bg-fundo">
      <CabecalhoPercurso passo={3} voltarPara="/aluno/notas" detalhe={aResponder ? detalhe : null} />

      <main className={`mx-auto w-full max-w-[1380px] px-4 pt-6 sm:px-6 md:pt-12 lg:px-12 ${aResponder ? "pb-36" : "pb-16"}`}>
        {conteudo}
      </main>

      {aResponder && (
        <footer className="fixed inset-x-0 bottom-0 z-40 border-t-[1.5px] border-borda bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(37,43,66,0.06)] sm:px-6 md:py-4 lg:px-12">
          <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-6">
            <div className="hidden w-80 sm:block">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[14px] font-semibold text-texto-suave">Pergunta {numero}</span>
                <span className="text-[12px] font-medium text-texto-suave">no máximo {MAX_PERGUNTAS}</span>
              </div>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-borda"
                role="progressbar"
                aria-label="Perguntas respondidas"
                aria-valuemin={0}
                aria-valuemax={MAX_PERGUNTAS}
                aria-valuenow={estado.respondidas}
              >
                <div className="h-full rounded-full bg-primaria transition-[width] duration-300 ease-out" style={{ width: `${percentagem}%` }} />
              </div>
            </div>
            <button
              type="button"
              onClick={seguinte}
              disabled={!escolha || aEnviar}
              className={`${BOTAO_PRINCIPAL} w-full sm:w-auto`}
            >
              {aEnviar ? "A enviar…" : "Seguinte"}
              {escolha && !aEnviar && <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />}
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
