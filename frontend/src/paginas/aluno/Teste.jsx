// Teste adaptativo (CAT).
// Computador: layout do design Figma (coluna lateral "Conhecer-te melhor" e
// cartão da pergunta), com as cores azuis do Njango Edu.
// Telemóvel: design do Stitch (lista de opções e botão "Seguinte" fixo em baixo).
// O servidor decide a pergunta seguinte e quando o teste acaba (5 a 18 perguntas).
// No fim vai sempre para as sugestões (o ecrã não propõe repetir o teste).
// O tempo de resposta conta até à escolha, não até ao toque em "Avançar".

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, Check, CircleCheck, Info, LoaderCircle, MessageCircle, Puzzle, RefreshCw, ShieldCheck, Sparkles,
  WifiOff,
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

// Ecrã final (design "Teste concluído"): progresso a 100%, ilustração com o
// visto, mensagem e botão para as sugestões. Não se propõe repetir o teste.
function Ilustracao({ className = "" }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-[16px] border-[1.5px] border-borda bg-white ${className}`}>
      <div aria-hidden="true" className="fundo-cruzes absolute inset-0" />
      <span aria-hidden="true" className="absolute left-[12%] top-[22%] h-2 w-2 rounded-full bg-samakaka-amarelo" />
      <span aria-hidden="true" className="absolute right-[10%] top-[30%] h-2.5 w-2.5 rounded-full bg-primaria-escura" />
      <span aria-hidden="true" className="absolute bottom-[24%] left-[22%] h-3 w-3 rounded-full bg-primaria" />
      <span aria-hidden="true" className="absolute bottom-[28%] right-[20%] h-2 w-2 rounded-full bg-samakaka-amarelo" />
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
        className="relative flex h-[88px] w-[88px] items-center justify-center rounded-full bg-primaria-clara"
      >
        <span className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-primaria text-white shadow-[0_6px_16px_rgba(31,111,192,0.35)]">
          <Check className="h-8 w-8" strokeWidth={3} aria-hidden="true" />
        </span>
      </motion.span>
    </div>
  );
}

// Telemóvel: progresso, ilustração e texto numa coluna.
// Computador: progresso e informação a toda a largura; a ilustração fica por baixo, numa faixa baixa.
function Conclusao({ respondidas, aoVerCursos }) {
  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-4 pb-32 pt-6 sm:px-6 md:pb-16 md:pt-12 lg:max-w-[1040px] lg:px-12 lg:pb-20 lg:pt-14">
      <div className="mb-5 px-1 lg:mb-10 lg:px-0">
        <BarraConcluida />
      </div>

      <Ilustracao className="mb-8 h-[220px] lg:hidden" />

      <section className="lg:rounded-[20px] lg:border-[1.5px] lg:border-borda lg:bg-white lg:p-12">
        <h1 className="mb-3 text-center text-[28px] font-bold leading-tight lg:mb-4 lg:text-left lg:text-[44px]">Teste concluído!</h1>
        <p className="mx-auto mb-6 max-w-[34ch] text-center text-[16px] leading-relaxed text-texto-suave lg:mx-0 lg:mb-8 lg:max-w-none lg:text-left lg:text-[19px]">
          Obrigado pelas tuas respostas. Vamos descobrir os cursos técnicos que mais combinam contigo.
        </p>

        <div className="mb-8 flex items-start gap-3 rounded-[12px] border border-borda bg-fundo p-4 lg:items-center lg:p-5">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primaria lg:mt-0 lg:h-6 lg:w-6" aria-hidden="true" />
          <p className="text-[14px] leading-relaxed lg:text-[16px]">
            Respondeste a <strong className="font-semibold text-primaria">{respondidas} perguntas</strong>. A seguir,
            juntamos as tuas notas e as tuas respostas para te sugerir até 3 cursos.
          </p>
        </div>

        {/* Telemóvel: botão fixo em baixo; computador: no fim do cartão */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t-[1.5px] border-borda bg-white px-4 py-3 sm:px-6 md:static md:border-0 md:bg-transparent md:p-0">
          <button type="button" onClick={aoVerCursos} className={`${BOTAO_PRINCIPAL} w-full lg:h-14 lg:w-auto lg:px-10 lg:text-[17px]`}>
            Ver os cursos sugeridos <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </div>
      </section>

      <Ilustracao className="mt-6 hidden h-[160px] lg:flex" />
    </div>
  );
}

function BarraConcluida() {
  return (
    <>
      <div className="mb-2 flex items-center justify-between text-[12px] font-bold uppercase tracking-wide lg:mb-3 lg:text-[14px]">
        <span className="text-texto-suave">Progresso do teste</span>
        <span className="text-primaria">100%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-primaria-clara lg:h-3" aria-hidden="true">
        <div className="barra-concluida h-full w-full rounded-full bg-primaria" />
      </div>
    </>
  );
}

export default function Teste() {
  const navegar = useNavigate();
  const { alunoId } = sessaoAluno();
  const { estado, carregando, aEnviar, erro, responder, recarregar, tempoDecorrido } = useTeste(alunoId);
  const [escolha, setEscolha] = useState(null); // { opcao, tempoMs }
  const titulo = useRef(null);

  const item = estado?.item;
  const respondidas = estado?.respondidas ?? 0;
  const numero = respondidas + 1;
  const percentagem = Math.min(100, Math.round((respondidas / MAX_PERGUNTAS) * 100));
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
    conteudo = <Conclusao respondidas={respondidas} aoVerCursos={() => navegar("/aluno/resultado")} />;
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
                    className="mb-2 text-[20px] font-semibold leading-[1.4] outline-none lg:text-[24px]"
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
