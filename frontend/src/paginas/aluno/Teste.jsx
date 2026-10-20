// Teste adaptativo (CAT).
// Computador: layout do design Figma (coluna lateral "Conhecer-te melhor" e
// cartão da pergunta), com as cores azuis do Njango Edu.
// Telemóvel: design do Stitch (lista de opções e botão "Seguinte" fixo em baixo).
// O servidor decide a pergunta seguinte e quando o teste acaba (5 a 18 perguntas).
// O tempo de resposta conta até à escolha, não até ao toque em "Avançar".

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, Check, CircleCheck, Info, LoaderCircle, MessageCircle, Puzzle, RefreshCw,
  RotateCcw, ShieldCheck, WifiOff,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { MAX_PERGUNTAS, MIN_PERGUNTAS } from "../../api/aluno";
import CabecalhoPercurso from "../../componentes/CabecalhoPercurso";
import { useTeste } from "../../hooks/useTeste";
import { sessaoAluno } from "../../sessao/sessaoAluno";

const BOTAO =
  "flex h-14 whitespace-nowrap items-center justify-center gap-2 rounded-[14px] px-8 text-[16px] font-semibold transition-[background-color,color,transform] active:scale-[0.99] disabled:cursor-not-allowed lg:h-[52px] lg:rounded-[10px]";
const BOTAO_PRINCIPAL = `${BOTAO} bg-primaria text-white hover:bg-primaria-escura disabled:bg-primaria-clara disabled:text-primaria/50`;
const BOTAO_SECUNDARIO = `${BOTAO} border-[1.5px] border-primaria text-primaria hover:bg-primaria-clara`;

function Opcao({ opcao, escolhida, desactivada, aoEscolher }) {
  const id = `opcao-${opcao.posicao}`;
  return (
    <label
      htmlFor={id}
      className={`group flex cursor-pointer items-center gap-3.5 rounded-[12px] border-[1.5px] px-4 py-4 transition-[border-color,background-color] lg:py-3.5 ${
        escolhida ? "border-primaria bg-primaria-clara" : "border-borda bg-white hover:border-primaria/50"
      } ${desactivada ? "pointer-events-none" : ""}`}
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
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold transition-colors peer-focus-visible:ring-4 peer-focus-visible:ring-primaria/30 ${
          escolhida ? "bg-primaria text-white" : "border-[1.5px] border-borda text-texto-suave group-hover:border-primaria/60"
        }`}
      >
        {escolhida ? <Check className="h-4 w-4" strokeWidth={3} /> : <span className="hidden lg:inline">{opcao.posicao}</span>}
      </span>
      <span className={`flex-1 text-[16px] leading-snug lg:text-[15px] ${escolhida ? "font-semibold text-primaria-escura lg:text-texto" : "font-medium"}`}>
        {opcao.texto}
      </span>
      {escolhida && (
        <span className="hidden rounded-full bg-white px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primaria-escura lg:inline">
          Selecionada
        </span>
      )}
    </label>
  );
}

function ColunaLateral({ respondidas, atual }) {
  return (
    <aside className="hidden w-[300px] shrink-0 flex-col border-r border-borda bg-white px-8 py-10 lg:flex">
      <p className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-primaria">
        <Puzzle className="h-4 w-4" aria-hidden="true" /> Perfil psicográfico
      </p>
      <h2 className="mb-2 text-[26px] font-bold leading-8">Conhecer-te melhor</h2>
      <p className="mb-8 text-[14px] leading-relaxed text-texto-suave">
        Não há respostas certas ou erradas. Escolhe a opção que mais se parece contigo.
      </p>
      <ol className="flex flex-col gap-3" aria-label="Perguntas">
        {Array.from({ length: respondidas }, (_, i) => (
          <li key={i} className="flex items-center gap-3 text-[14px] font-medium text-texto-suave">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primaria text-white">
              <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
            </span>
            Pergunta {i + 1}<span className="sr-only"> (respondida)</span>
          </li>
        ))}
        {atual && (
          <li className="flex items-center gap-3" aria-current="step">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primaria text-[13px] font-bold text-white">
              {respondidas + 1}
            </span>
            <span className="flex flex-col leading-tight">
              <span className="text-[14px] font-semibold">Pergunta {respondidas + 1}</span>
              <span className="text-[12px] font-medium text-primaria">Em curso</span>
            </span>
          </li>
        )}
      </ol>
      <p className="mt-6 text-[13px] leading-relaxed text-texto-suave">
        As perguntas adaptam-se às tuas respostas. O teste termina entre a {MIN_PERGUNTAS}.ª e a {MAX_PERGUNTAS}.ª pergunta.
      </p>
      <p className="mt-auto flex items-start gap-2.5 pt-10 text-[13px] leading-snug text-texto-suave">
        <ShieldCheck className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
        As tuas respostas são tratadas com privacidade.
      </p>
    </aside>
  );
}

// Ecrã final: resumo das perguntas à esquerda e mensagem ao centro (design Figma).
function Conclusao({ nome, respondidas, podeRepetir, aEnviar, erro, aoRepetir, aoVerCursos }) {
  return (
    <div className="mx-auto flex w-full max-w-[920px] flex-col-reverse items-center gap-8 px-4 py-8 sm:px-6 md:py-16 lg:flex-row lg:items-center lg:gap-14">
      <div className="w-full max-w-[300px] rounded-[16px] border-[1.5px] border-borda bg-white p-6">
        <p className="text-[12px] font-bold uppercase tracking-wide text-primaria">Teste adaptativo</p>
        <p className="mb-4 text-[18px] font-bold">{respondidas} perguntas respondidas</p>
        {respondidas <= 6 ? (
          <ul className="mb-5 flex flex-col gap-2.5">
            {Array.from({ length: respondidas }, (_, i) => (
              <li key={i} className="flex items-center gap-2.5 text-[14px]">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primaria text-white">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                </span>
                Pergunta {i + 1}
              </li>
            ))}
          </ul>
        ) : (
          // Muitas perguntas: números em grelha, para o cartão não ficar enorme.
          <ul className="mb-5 grid grid-cols-6 gap-2" aria-label={`${respondidas} perguntas respondidas`}>
            {Array.from({ length: respondidas }, (_, i) => (
              <li key={i} className="flex h-8 items-center justify-center rounded-full bg-primaria text-[13px] font-bold text-white">
                {i + 1}
              </li>
            ))}
          </ul>
        )}
        <p className="flex items-center gap-2 rounded-[10px] border border-borda px-3 py-2.5 text-[13px] text-texto-suave">
          <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" /> Respostas guardadas com segurança
        </p>
      </div>

      <div className="flex max-w-[520px] flex-col items-center text-center lg:items-start lg:text-left">
        {podeRepetir ? (
          <>
            <span className="mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-primaria-clara">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primaria text-white">
                <RotateCcw className="h-6 w-6" aria-hidden="true" />
              </span>
            </span>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-primaria">Teste concluído</p>
            <h1 className="mb-4 text-[30px] font-bold leading-tight md:text-[38px]">Queres responder outra vez?</h1>
            <p className="mb-3 text-[16px] leading-relaxed text-texto-suave">
              Algumas respostas foram muito rápidas ou pouco parecidas entre si. Se responderes outra vez, com mais
              calma, as sugestões ficam mais certas para ti.
            </p>
            <p className="mb-7 text-[14px] font-semibold text-texto-suave">Só é possível repetir uma vez.</p>
            {erro && <p role="alert" className="mb-4 w-full rounded-lg bg-red-50 px-3 py-2 text-[14px] text-red-700">{erro.message}</p>}
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
              <button type="button" onClick={aoRepetir} disabled={aEnviar} className={BOTAO_PRINCIPAL}>
                <RotateCcw className="h-[18px] w-[18px]" aria-hidden="true" />
                {aEnviar ? "A preparar…" : "Responder outra vez"}
              </button>
              <button type="button" onClick={aoVerCursos} className={BOTAO_SECUNDARIO}>
                Ver os cursos sugeridos
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-primaria-clara">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primaria text-white">
                <Check className="h-6 w-6" strokeWidth={3} aria-hidden="true" />
              </span>
            </span>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-primaria">Teste concluído</p>
            <h1 className="mb-4 text-[30px] font-bold leading-tight md:text-[42px]">
              Boa{nome ? `, ${nome}` : ""}! O teu teste está concluído.
            </h1>
            <p className="mb-6 text-[16px] leading-relaxed text-texto-suave md:text-[17px]">
              As tuas respostas, junto com as tuas notas, ajudam a encontrar os cursos técnicos que mais combinam
              contigo.
            </p>
            <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-primaria-clara px-4 py-2 text-[14px] font-semibold text-primaria-escura">
              <span className="h-2 w-2 rounded-full bg-primaria" aria-hidden="true" /> A seguir: os cursos sugeridos
            </p>
            <button type="button" onClick={aoVerCursos} className={`${BOTAO_PRINCIPAL} w-full sm:w-auto`}>
              <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" /> Ver os cursos sugeridos
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Teste() {
  const navegar = useNavigate();
  const { alunoId, nome } = sessaoAluno();
  const { estado, carregando, aEnviar, erro, responder, repetir, recarregar, tempoDecorrido } = useTeste(alunoId);
  const [escolha, setEscolha] = useState(null); // { opcao, tempoMs }
  const titulo = useRef(null);

  const item = estado?.item;
  const respondidas = estado?.respondidas ?? 0;
  const numero = respondidas + 1;
  const percentagem = Math.min(100, Math.round((respondidas / MAX_PERGUNTAS) * 100));
  const primeiroNome = (nome ?? "").trim().split(/\s+/)[0];
  const aResponder = Boolean(item) && !estado?.terminado;
  const erroAoGuardar = aResponder && erro;

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

  function avancar() {
    if (escolha && !aEnviar) responder(escolha.opcao, escolha.tempoMs);
  }

  const textoBotao = aEnviar ? "A guardar…" : null;

  let conteudo;
  if (carregando) {
    conteudo = (
      <div className="mx-auto w-full max-w-[760px] animate-pulse px-4 py-8 lg:py-12" aria-live="polite">
        <span className="sr-only">A carregar a pergunta…</span>
        <div className="mb-3 h-4 w-32 rounded bg-borda" />
        <div className="mb-2 h-7 w-full rounded bg-borda" />
        <div className="mb-8 h-7 w-2/3 rounded bg-borda" />
        {[0, 1, 2, 3].map((i) => <div key={i} className="mb-3 h-16 rounded-[12px] bg-borda/70" />)}
      </div>
    );
  } else if (!estado) {
    conteudo = (
      <div className="mx-auto mt-10 w-full max-w-[560px] rounded-[16px] border-[1.5px] border-borda bg-white p-8 text-center">
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-700">
          <WifiOff className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mb-2 text-[22px] font-bold">Não foi possível carregar a pergunta</h1>
        <p className="mb-6 text-texto-suave">Verifica a ligação e tenta novamente.</p>
        <button type="button" onClick={recarregar} className={`${BOTAO_PRINCIPAL} mx-auto w-full sm:w-auto`}>
          <RefreshCw className="h-[18px] w-[18px]" aria-hidden="true" /> Tentar novamente
        </button>
      </div>
    );
  } else if (estado.terminado) {
    conteudo = (
      <Conclusao
        nome={primeiroNome}
        respondidas={respondidas}
        podeRepetir={estado.pode_repetir}
        aEnviar={aEnviar}
        erro={erro}
        aoRepetir={repetir}
        aoVerCursos={() => navegar("/aluno/resultado")}
      />
    );
  } else {
    conteudo = (
      <div className="flex flex-1">
        <ColunaLateral respondidas={respondidas} atual />

        <div className="flex flex-1 flex-col">
          {/* Telemóvel: aviso de erro no topo (design Stitch) */}
          {erroAoGuardar && (
            <div role="alert" className="flex items-center gap-3 border-b border-red-200 bg-red-50 px-4 py-3 lg:hidden">
              <WifiOff className="h-5 w-5 shrink-0 text-red-700" aria-hidden="true" />
              <p className="flex-1 text-[13px] font-medium leading-snug text-red-800">
                Sem ligação. A tua resposta ainda não foi guardada.
              </p>
              <button
                type="button"
                onClick={avancar}
                disabled={aEnviar}
                className="shrink-0 rounded-[8px] border border-red-300 bg-white px-3 py-2 text-[13px] font-semibold text-red-700"
              >
                Tentar de novo
              </button>
            </div>
          )}

          <div className="flex flex-1 items-start justify-center px-4 pb-40 pt-6 sm:px-6 lg:items-center lg:px-10 lg:py-12">
            <section className="w-full max-w-[760px] lg:rounded-[20px] lg:border-[1.5px] lg:border-borda lg:bg-white lg:p-10 lg:shadow-[0_12px_32px_rgba(37,43,66,0.06)]">
              {/* Progresso (computador) */}
              <div className="mb-7 hidden lg:block">
                <div className="mb-2 flex items-center justify-between text-[14px]">
                  <span className="font-semibold">Pergunta {numero}</span>
                  <span className="text-[13px] font-medium text-texto-suave">no máximo {MAX_PERGUNTAS}</span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-primaria-clara"
                  role="progressbar"
                  aria-label="Perguntas respondidas"
                  aria-valuemin={0}
                  aria-valuemax={MAX_PERGUNTAS}
                  aria-valuenow={respondidas}
                >
                  <div className="h-full rounded-full bg-primaria transition-[width] duration-300 ease-out" style={{ width: `${percentagem}%` }} />
                </div>
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  <p className="mb-3 flex items-center gap-2.5 text-[12px] font-bold uppercase tracking-wide text-primaria">
                    <span className="hidden h-8 w-8 items-center justify-center rounded-full bg-primaria-clara lg:flex">
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="lg:hidden">Pergunta {numero}</span>
                    <span className="hidden lg:inline">Imagina esta situação</span>
                    {estado.tentativa > 1 && (
                      <span className="rounded-full bg-fundo px-2.5 py-0.5 normal-case tracking-normal text-texto-suave ring-1 ring-borda">
                        2.ª tentativa
                      </span>
                    )}
                  </p>
                  <h1
                    ref={titulo}
                    tabIndex={-1}
                    id="enunciado"
                    className="mb-2 text-[24px] font-bold leading-[1.3] tracking-tight outline-none lg:text-[26px]"
                  >
                    {item.texto}
                  </h1>
                  <p className="mb-6 text-[15px] text-texto-suave lg:text-[16px]">Escolhe a opção que mais se parece contigo.</p>

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

              <p className="mt-6 text-center text-[14px] text-texto-suave lg:hidden">Não há respostas certas nem erradas.</p>

              {/* Rodapé do cartão (computador) */}
              {erroAoGuardar ? (
                <div role="alert" className="mt-7 hidden items-center gap-4 rounded-[14px] border border-red-200 bg-red-50 p-4 lg:flex">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-red-700">
                    <WifiOff className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="flex-1">
                    <p className="text-[15px] font-bold">A resposta ainda não foi guardada</p>
                    <p className="text-[13px] text-texto-suave">Verifica a ligação. A tua seleção continua aqui e podes tentar novamente.</p>
                  </div>
                  <button
                    type="button"
                    onClick={avancar}
                    disabled={aEnviar}
                    className="flex h-12 items-center gap-2 rounded-[10px] border border-borda bg-white px-5 text-[15px] font-semibold text-primaria hover:bg-primaria-clara"
                  >
                    <RefreshCw className={`h-[18px] w-[18px] ${aEnviar ? "animate-spin" : ""}`} aria-hidden="true" /> Tentar novamente
                  </button>
                </div>
              ) : (
                <div className="mt-7 hidden items-center justify-between gap-6 lg:flex">
                  <p className={`flex items-center gap-2 text-[13px] ${escolha ? "text-emerald-700" : "text-texto-suave"}`} aria-live="polite">
                    {escolha ? <CircleCheck className="h-4 w-4" aria-hidden="true" /> : <Info className="h-4 w-4" aria-hidden="true" />}
                    {escolha ? "Resposta selecionada. Podes avançar." : "Seleciona uma opção para continuar."}
                  </p>
                  <button type="button" onClick={avancar} disabled={!escolha || aEnviar} className={`${BOTAO_PRINCIPAL} min-w-[156px]`}>
                    {aEnviar ? <LoaderCircle className="h-[18px] w-[18px] animate-spin" aria-hidden="true" /> : escolha && <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />}
                    {textoBotao ?? "Avançar"}
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Telemóvel: botão fixo em baixo (design Stitch) */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t-[1.5px] border-borda bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(37,43,66,0.06)] sm:px-6 lg:hidden">
          <button type="button" onClick={avancar} disabled={!escolha || aEnviar} className={`${BOTAO_PRINCIPAL} w-full`}>
            {aEnviar && <LoaderCircle className="h-[18px] w-[18px] animate-spin" aria-hidden="true" />}
            {textoBotao ?? "Seguinte"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-fundo">
      <CabecalhoPercurso passo={3} voltarPara="/aluno/notas" />
      <main className="flex flex-1 flex-col">{conteudo}</main>
    </div>
  );
}
