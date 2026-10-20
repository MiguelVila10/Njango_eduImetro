// Notas da 9.ª classe, com a Nzinga e o Kiala a acompanhar.
// As disciplinas aparecem agrupadas por área para o aluno encontrar mais
// depressa no boletim. Notas baixas nunca são criticadas: as personagens
// encorajam. Só um valor impossível (fora de 10-20) gera dúvida.

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Cabecalho from "../../componentes/Cabecalho";
import Passos from "../../componentes/Passos";
import Palco, { usePersonagens } from "../../componentes/personagens/Palco";
import { A_PENSAR, CONTENTE, DUVIDA, SURPRESA } from "../../componentes/personagens/Personagem";
import { useNotas, validarNota } from "../../hooks/useNotas";
import { sessaoAluno } from "../../sessao/sessaoAluno";

const AREAS = [
  ["Ciências", ["Matemática", "Física", "Química", "Biologia"]],
  ["Línguas e Humanidades", ["Português", "Língua Estrangeira", "História", "Geografia", "Educação Moral e Cívica"]],
  ["Expressões", ["Educação Física", "Educação Visual", "Educação Laboral"]],
];
const TOTAL = AREAS.reduce((n, [, ds]) => n + ds.length, 0);
const reduzirMovimento = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// "a Matemática", "a Educação Física"… (forma natural em português de Angola)
const aDisciplina = (d) => `a ${d}`;

function reacao(disciplina, valor) {
  if (valor === "") return null;
  if (validarNota(valor)) {
    return [DUVIDA, "As notas vão de 10 a 20. Confirma no teu boletim.", "Hmm…"];
  }
  const n = Number(valor);
  if (n >= 18) return [SURPRESA, `Uau, ${n} ${aDisciplina(disciplina)}!`, "Que máquina!"];
  if (n >= 14) return [CONTENTE, `${n} ${aDisciplina(disciplina)}, muito bem!`, "Boa!"];
  if (n >= 12) return [CONTENTE, `${n} ${aDisciplina(disciplina)}. Está bem!`, "Fixe!"];
  return [CONTENTE, "Tudo bem. As notas mostram só uma parte de ti.", "Força!"];
}

export default function Notas() {
  const navegar = useNavigate();
  const { alunoId, nome } = sessaoAluno();
  const { notas, erros, definirNota, guardar, carregando, aGuardar, erro } = useNotas(alunoId);
  const { nzinga, kiala, falar } = usePersonagens();
  const temporizadores = useRef({});
  const [tocadas, setTocadas] = useState({});

  const preenchidas = Object.values(notas).filter((v) => v !== "" && !validarNota(v)).length;
  const completo = preenchidas === TOTAL;
  const primeiro = (nome ?? "").trim().split(/\s+/)[0];

  useEffect(() => {
    const t = temporizadores.current;
    t.inicio = setTimeout(() => {
      falar(
        `Agora as tuas notas, ${primeiro}. Tens o boletim à mão?`, CONTENTE, true,
        "Escreve a nota final de cada disciplina.", CONTENTE, true,
      );
    }, 400);
    return () => Object.values(t).forEach(clearTimeout);
  }, [falar, primeiro]);

  function aoFocar(d) {
    clearTimeout(temporizadores.current.espera);
    temporizadores.current.espera = setTimeout(() => {
      if (notas[d] === "") falar(`Quanto tiveste ${aDisciplina(d)}?`, A_PENSAR, false, null, A_PENSAR, false);
    }, 140);
  }

  function aoEscrever(d, valor) {
    definirNota(d, valor);
    clearTimeout(temporizadores.current.espera);
    temporizadores.current.espera = setTimeout(() => {
      const r = reacao(d, valor);
      if (!r) return;
      const novas = { ...notas, [d]: valor };
      const todas = Object.values(novas).filter((v) => v !== "" && !validarNota(v)).length === TOTAL;
      if (todas) {
        falar("Todas as notas estão aqui! Agora vem o teste.", CONTENTE, false, "Vamos a isso!", CONTENTE, false);
      } else {
        falar(r[1], r[0], false, r[2], r[0], false);
      }
    }, reduzirMovimento() ? 0 : 450);
  }

  async function submeter(e) {
    e.preventDefault();
    setTocadas(Object.fromEntries(AREAS.flatMap(([, ds]) => ds).map((d) => [d, true])));
    if (!completo) {
      falar(`Faltam ${TOTAL - preenchidas} notas.`, DUVIDA, false, "Quase lá!", DUVIDA, false);
      return;
    }
    clearTimeout(temporizadores.current.espera);
    if (await guardar()) {
      falar("Perfeito! Agora umas perguntas sobre ti.", CONTENTE, true, "Não há respostas erradas!", CONTENTE, true);
      temporizadores.current.seguir = setTimeout(() => navegar("/aluno/teste"), reduzirMovimento() ? 300 : 2200);
    } else {
      falar("Ups, não consegui guardar. Tenta outra vez.", DUVIDA, false, "Hmm…", DUVIDA, false);
    }
  }

  return (
    <div className="min-h-screen bg-fundo">
      <Cabecalho />
      <main className="mx-auto grid max-w-[1180px] grid-cols-1 gap-4 px-4 pb-10 pt-4 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-6 md:pt-6">
        <Palco nzinga={nzinga} kiala={kiala} />

        <form onSubmit={submeter} noValidate className="flex min-w-0 flex-col gap-5 rounded-[20px] bg-white p-6 shadow-[0_10px_28px_rgba(37,43,66,0.07)] md:p-8">
          <Passos atual={2} />
          <div>
            <h1 className="text-[26px] font-bold leading-tight md:text-[30px]">As tuas notas</h1>
            <p className="mt-1 text-texto-suave">Escreve a nota final de cada disciplina da 9.ª classe, de 10 a 20.</p>
          </div>

          {/* Progresso */}
          <div aria-live="polite">
            <div className="mb-1.5 flex justify-between text-[14px] font-semibold">
              <span>{preenchidas} de {TOTAL} notas</span>
              {completo && <span className="text-emerald-700">Completo</span>}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-fundo" role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL} aria-valuenow={preenchidas} aria-label="Notas preenchidas">
              <div className="h-full rounded-full bg-primaria transition-[width] duration-300 ease-out" style={{ width: `${(preenchidas / TOTAL) * 100}%` }} />
            </div>
          </div>

          {carregando ? (
            <p className="text-texto-suave" aria-live="polite">A carregar…</p>
          ) : (
            AREAS.map(([area, disciplinas]) => (
              <fieldset key={area} className="min-w-0">
                <legend className="mb-3 text-[13px] font-bold uppercase tracking-wider text-primaria">{area}</legend>
                <div className="grid grid-cols-2 items-end gap-x-4 gap-y-3 sm:grid-cols-3">
                  {disciplinas.map((d) => {
                    const id = `nota-${d.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]+/g, "-")}`;
                    const valor = notas[d];
                    const msg = (tocadas[d] || valor !== "" || erros[d]) && validarNota(valor);
                    const certo = valor !== "" && !validarNota(valor);
                    return (
                      <div key={d} className="flex min-w-0 flex-col gap-1">
                        <label htmlFor={id} className="text-[14px] font-semibold leading-tight">{d}</label>
                        <input
                          id={id}
                          type="text"
                          inputMode="numeric"
                          maxLength={2}
                          placeholder="10–20"
                          value={valor}
                          onFocus={() => aoFocar(d)}
                          onBlur={() => setTocadas((t) => ({ ...t, [d]: true }))}
                          onChange={(e) => aoEscrever(d, e.target.value.replace(/\D/g, ""))}
                          aria-invalid={Boolean(msg)}
                          aria-describedby={msg ? `${id}-erro` : undefined}
                          className={`h-12 w-full rounded-[10px] border-[1.5px] bg-white px-3 text-center text-[18px] font-semibold tabular-nums outline-none transition-[border-color,box-shadow] ${
                            msg ? "border-red-600 ring-4 ring-red-50" : certo ? "border-emerald-600" : "border-borda focus:border-primaria focus:ring-4 focus:ring-primaria/15"
                          }`}
                        />
                        {msg && <p id={`${id}-erro`} className="text-[12px] font-medium text-red-700">{msg}</p>}
                      </div>
                    );
                  })}
                </div>
              </fieldset>
            ))
          )}

          {erro && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[14px] text-red-700">{erro.message}</p>}

          <button
            type="submit"
            disabled={aGuardar || carregando}
            className="h-14 rounded-[10px] bg-primaria text-[16px] font-bold text-white transition-[background-color,transform] hover:bg-primaria-escura active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-borda disabled:text-texto-suave"
          >
            {aGuardar ? "A guardar…" : "Continuar para o teste"}
          </button>
        </form>
      </main>
    </div>
  );
}
