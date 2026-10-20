// Notas da 9.ª classe: design do Stitch (computador) e do Figma (telemóvel).
// Sem personagens: a Nzinga e o Kiala aparecem só no registo.

import { AlertCircle, ArrowRight, Info, Lightbulb } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { DISCIPLINAS } from "../../api/aluno";
import CabecalhoPercurso from "../../componentes/CabecalhoPercurso";
import { useNotas, validarNota } from "../../hooks/useNotas";
import { sessaoAluno } from "../../sessao/sessaoAluno";

const TOTAL = DISCIPLINAS.length;
const METADE = Math.ceil(TOTAL / 2);
const COLUNAS = [DISCIPLINAS.slice(0, METADE), DISCIPLINAS.slice(METADE)];
const idCampo = (d) => `nota-${d.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z]+/g, "-")}`;
const valida = (v) => v !== "" && !validarNota(v);

// separador: "sempre", "telemovel" (só quando as colunas se juntam) ou "nunca"
function CampoNota({ disciplina, valor, mostrarErro, separador, aoEscrever, aoSair }) {
  const id = idCampo(disciplina);
  const erro = mostrarErro ? validarNota(valor) : null;
  const linha = { sempre: "border-b border-borda", telemovel: "border-b border-borda md:border-b-0", nunca: "" }[separador];
  return (
    <div className={`py-3 md:py-4 ${linha}`}>
      <div className="grid min-h-[52px] grid-cols-[minmax(0,1fr)_80px] items-center gap-4 md:grid-cols-[minmax(0,1fr)_96px]">
        <label htmlFor={id} className="text-[16px] font-semibold leading-snug">{disciplina}</label>
        <input
          id={id}
          type="text"
          inputMode="numeric"
          maxLength={2}
          autoComplete="off"
          value={valor}
          onBlur={aoSair}
          onChange={(e) => aoEscrever(e.target.value.replace(/\D/g, ""))}
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? `${id}-erro` : undefined}
          className={`h-[52px] w-full rounded-[12px] border-[1.5px] bg-white text-center text-[20px] font-bold tabular-nums outline-none transition-[border-color,box-shadow] md:h-14 md:rounded-[8px] ${
            erro
              ? "border-2 border-[#C0392B] text-[#C0392B] ring-4 ring-[#C0392B]/10"
              : "border-borda text-texto focus:border-2 focus:border-primaria focus:ring-4 focus:ring-primaria/15"
          }`}
        />
      </div>
      {erro && (
        <p id={`${id}-erro`} className="mt-2 flex items-start gap-2 text-[14px] font-medium text-[#C0392B]">
          <AlertCircle className="mt-0.5 h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          A nota tem de estar entre 10 e 20.
        </p>
      )}
    </div>
  );
}

export default function Notas() {
  const navegar = useNavigate();
  const { alunoId } = sessaoAluno();
  const { notas, definirNota, guardar, carregando, aGuardar, erro } = useNotas(alunoId);
  const [tocadas, setTocadas] = useState({});

  const preenchidas = Object.values(notas).filter(valida).length;
  const completo = preenchidas === TOTAL;
  const percentagem = Math.round((preenchidas / TOTAL) * 100);
  async function continuar() {
    setTocadas(Object.fromEntries(DISCIPLINAS.map((d) => [d, true])));
    if (!completo || aGuardar) return;
    if (await guardar()) navegar("/aluno/teste");
  }

  return (
    <div className="min-h-screen bg-fundo">
      <CabecalhoPercurso passo={2} voltarPara="/" detalhe={`${preenchidas} de ${TOTAL} notas preenchidas`} />

      <main className="mx-auto w-full max-w-[1380px] px-4 pb-36 pt-6 sm:px-6 md:pt-10 lg:px-12">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
          {/* Formulário */}
          <section className="flex w-full min-w-0 flex-col lg:col-span-8">
            <h1 className="mb-2 text-[28px] font-bold leading-9 tracking-tight md:text-[32px] md:leading-10">
              As tuas notas da 9.ª classe
            </h1>
            <p className="mb-6 text-[16px] font-medium leading-[1.6] text-texto-suave md:text-[17px]">
              Escreve a nota final de cada disciplina, de 10 a 20, tal como aparece no teu boletim.
              <span className="hidden md:inline"> As notas mostram em que áreas tens mais facilidade.</span>
            </p>

            <div className="mb-6 flex items-start gap-3.5 rounded-[8px] border border-primaria/20 bg-primaria-clara p-4 md:mb-8">
              <Lightbulb className="mt-0.5 h-6 w-6 shrink-0 text-primaria-escura" strokeWidth={1.8} aria-hidden="true" />
              <p className="text-[14px] font-medium leading-relaxed">
                <span className="hidden md:inline">Tem o teu boletim à mão. </span>
                Escreve as notas verdadeiras: assim, as sugestões ficam mais certas para ti.
              </p>
            </div>

            <div className="rounded-[12px] border-[1.5px] border-borda bg-white px-4 py-1 shadow-sm md:px-8 md:py-4">
              {carregando ? (
                <p className="py-6 text-texto-suave" aria-live="polite">A carregar as tuas notas…</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-10">
                  {COLUNAS.map((coluna, c) => (
                    <div key={c} className="flex min-w-0 flex-col">
                      {coluna.map((d, i) => {
                        const fim = i === coluna.length - 1;
                        return (
                          <CampoNota
                            key={d}
                            disciplina={d}
                            valor={notas[d] ?? ""}
                            mostrarErro={(tocadas[d] || (notas[d] ?? "").length >= 2) && notas[d] !== ""}
                            separador={!fim ? "sempre" : c === 0 ? "telemovel" : "nunca"}
                            aoSair={() => setTocadas((t) => ({ ...t, [d]: true }))}
                            aoEscrever={(v) => definirNota(d, v)}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {erro && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-[14px] text-red-700">{erro.message}</p>}
          </section>

          {/* Coluna lateral (só computador): informação */}
          <aside className="hidden flex-col gap-6 lg:sticky lg:top-28 lg:col-span-4 lg:flex">
            <div className="rounded-[12px] border-[1.5px] border-borda bg-white p-5">
              <p className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-texto-suave">
                <Info className="h-[18px] w-[18px]" aria-hidden="true" /> Sistema angolano
              </p>
              <p className="text-[13px] leading-relaxed text-texto-suave">
                Em Angola as notas vão de 0 a 20 valores, e 10 é a nota positiva. Por isso aqui escreves notas de 10 a 20.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* Barra fixa em baixo */}
      <footer className="fixed inset-x-0 bottom-0 z-40 border-t-[1.5px] border-borda bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(37,43,66,0.06)] sm:px-6 md:py-4 lg:px-12">
        <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-6">
          <div className="hidden w-80 sm:block" aria-live="polite">
            <div className="mb-2 flex items-center justify-between">
              <span className={`text-[14px] font-semibold ${completo ? "text-emerald-700" : "text-texto-suave"}`}>
                {preenchidas} de {TOTAL} notas preenchidas
              </span>
              <span className="text-[12px] font-medium tabular-nums text-texto-suave">{percentagem}%</span>
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-borda"
              role="progressbar" aria-label="Notas preenchidas"
              aria-valuemin={0} aria-valuemax={TOTAL} aria-valuenow={preenchidas}
            >
              <div
                className={`h-full rounded-full transition-[width] duration-300 ease-out ${completo ? "bg-emerald-700" : "bg-primaria"}`}
                style={{ width: `${percentagem}%` }}
              />
            </div>
          </div>
          <p className="sr-only sm:hidden" aria-live="polite">{preenchidas} de {TOTAL} notas preenchidas</p>
          <div className="flex w-full items-center justify-end gap-4 sm:w-auto">
            <button
              type="button"
              onClick={() => navegar("/")}
              className="hidden h-14 items-center rounded-[8px] border-[1.5px] border-primaria px-8 text-[16px] font-semibold text-primaria transition-colors hover:bg-primaria-clara sm:flex"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={continuar}
              disabled={!completo || aGuardar}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-primaria px-8 text-[16px] font-semibold text-white transition-[background-color,transform] hover:bg-primaria-escura active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-borda disabled:text-texto-suave sm:w-auto sm:rounded-[8px]"
            >
              {aGuardar ? "A guardar…" : "Continuar para o teste"}
              {completo && !aGuardar && <ArrowRight className="h-[18px] w-[18px]" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
