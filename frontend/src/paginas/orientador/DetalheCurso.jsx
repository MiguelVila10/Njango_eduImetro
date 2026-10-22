// Detalhe de um curso para o orientador (design "Njango Edu — Detalhe do
// curso"): perfil, quantas vezes foi sugerido/escolhido, pré-requisitos,
// notas ideais e descrição. RF12: pode editar (painel lateral); não apaga.

import { ArrowLeft, BookOpen, CheckSquare, CircleCheck, Lightbulb, Lock, Pencil, RefreshCw, SlidersHorizontal, Trophy } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { obterCurso } from "../../api/orientador";
import FormularioCurso from "../../componentes/orientador/FormularioCurso";
import { COR_PERFIL, Cartao, nomeCurtoCurso } from "../../componentes/orientador/pecas";
import { useCarregar } from "../../hooks/useCarregar";

const ESCALA = [10, 12, 14, 16, 18, 20];
const largura = (nota) => `${((nota - 10) / 10) * 100}%`;

/** As 3 disciplinas com nota ideal mais alta (as que mais pesam na comparação). */
function maisImportantes(notas) {
  const ordenadas = [...notas].sort((a, b) => b.peso_ideal - a.peso_ideal);
  const minimo = Math.min(...notas.map((n) => n.peso_ideal));
  return new Set(ordenadas.slice(0, 3).filter((n) => n.peso_ideal > minimo).map((n) => n.disciplina));
}

function Metrica({ rotulo, valor, icone: Icone }) {
  return (
    <Cartao className="p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <p className="text-[15px] text-texto-suave">{rotulo}</p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-borda text-primaria">
          <Icone className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
      </div>
      <p className="text-[32px] font-bold leading-none tabular-nums">{valor ?? 0}</p>
    </Cartao>
  );
}

function IconeCartao({ icone: Icone }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-primaria-clara text-primaria">
      <Icone className="h-[18px] w-[18px]" aria-hidden="true" />
    </span>
  );
}

export default function DetalheCurso() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { key } = useLocation();
  const { dados: c, erro, carregando, recarregar } = useCarregar(() => obterCurso(id), [id]);
  const [editar, setEditar] = useState(false);
  const [guardado, setGuardado] = useState(false);

  function voltar(e) {
    if (key !== "default") { e.preventDefault(); navegar(-1); }
  }

  const importantes = c?.notas_ideais?.length ? maisImportantes(c.notas_ideais) : new Set();
  const cor = COR_PERFIL[c?.arquetipo_dominante] ?? "#1f6fc0";

  return (
    <main className="mx-auto w-full max-w-[1160px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <Link to="/orientador/cursos" onClick={voltar} className="mb-6 inline-flex items-center gap-2 text-[15px] font-medium text-primaria hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar à lista de cursos
      </Link>

      {carregando && !c && <div className="h-[520px] animate-pulse rounded-[12px] bg-borda/60" aria-label="A carregar o curso" />}
      {erro && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-red-50 px-5 py-4 text-[15px] text-red-700">
          <span>{erro.status === 404 ? "Este curso não existe." : `Não foi possível carregar o curso. ${erro.message}`}</span>
          {erro.status !== 404 && (
            <button type="button" onClick={recarregar} className="flex items-center gap-2 font-semibold underline">
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Tentar de novo
            </button>
          )}
        </div>
      )}

      {c && (
        <div className="flex flex-col gap-6">
          {guardado && (
            <p role="status" className="flex items-center gap-2 rounded-[12px] bg-emerald-50 px-5 py-4 text-[15px] font-medium text-emerald-800">
              <CircleCheck className="h-5 w-5" aria-hidden="true" /> Alterações guardadas. Contam para os próximos testes.
            </p>
          )}

          <Cartao className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-[28px] font-bold leading-tight">{nomeCurtoCurso(c.nome)}</h1>
                <p className="mt-1 text-[16px] text-texto-suave">{c.nome} · {c.instituicao}</p>
              </div>
              <span className="inline-flex items-center gap-2 self-start rounded-[8px] border px-4 py-2 text-[15px] font-semibold"
                style={{ color: cor, borderColor: `${cor}40`, backgroundColor: `${cor}12` }}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cor }} aria-hidden="true" />
                Perfil dominante: {c.arquetipo_dominante}
              </span>
            </div>
            <div className="mt-5 flex flex-col gap-3 border-t border-borda pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-[14px] text-texto-suave">
                <Lock className="h-4 w-4 shrink-0" aria-hidden="true" /> Os cursos não podem ser apagados pela aplicação.
              </p>
              <button type="button" onClick={() => { setGuardado(false); setEditar(true); }}
                className="flex h-10 items-center justify-center gap-2 self-start rounded-[8px] border-[1.5px] border-primaria px-4 text-[14px] font-semibold text-primaria hover:bg-primaria-clara">
                <Pencil className="h-4 w-4" aria-hidden="true" /> Editar curso
              </button>
            </div>
          </Cartao>

          <div className="grid gap-6 sm:grid-cols-3">
            <Metrica rotulo="Vezes sugerido" valor={c.vezes_sugerido} icone={Lightbulb} />
            <Metrica rotulo="Vezes escolhido pelos alunos" valor={c.vezes_escolhido} icone={CircleCheck} />
            <Metrica rotulo="Vezes em 1.º lugar" valor={c.vezes_primeiro} icone={Trophy} />
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[5fr_7fr]">
            <Cartao className="p-6">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="text-[20px] font-semibold">Pré-requisitos</h2>
                <IconeCartao icone={CheckSquare} />
              </div>
              <p className="mb-5 text-[15px] leading-relaxed text-texto-suave">O curso só é sugerido a alunos que tenham pelo menos estas notas.</p>
              {c.prerequisitos.length ? (
                <ul className="flex flex-col gap-3">
                  {c.prerequisitos.map((p) => (
                    <li key={p.disciplina} className="flex items-center justify-between gap-3 rounded-[10px] border border-borda bg-[#fafbfd] px-4 py-3.5">
                      <span className="flex items-center gap-3 text-[15px] font-semibold">
                        <span className="h-2 w-2 rounded-full bg-primaria" aria-hidden="true" /> {p.disciplina}
                      </span>
                      <span className="rounded-[8px] border border-borda bg-white px-3 py-1.5 text-[15px] font-bold tabular-nums text-primaria">≥ {p.nota_min}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="rounded-[10px] bg-[#fafbfd] px-4 py-3.5 text-[15px] text-texto-suave">Este curso não tem notas mínimas: pode ser sugerido a qualquer aluno.</p>
              )}
              <p className="mt-5 border-t border-borda pt-4 text-[13px] text-texto-suave">
                Critério eliminatório: um aluno abaixo de uma destas notas não recebe este curso como sugestão.
              </p>
            </Cartao>

            <Cartao className="p-6">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="text-[20px] font-semibold">Notas ideais</h2>
                <IconeCartao icone={SlidersHorizontal} />
              </div>
              <p className="mb-6 text-[15px] leading-relaxed text-texto-suave">Nota ideal em cada disciplina, de 10 a 20. Serve para comparar o curso com as notas do aluno.</p>
              {c.notas_ideais.length ? (
                <>
                  <div className="mb-2 hidden grid-cols-[minmax(170px,240px)_1fr_32px] items-end gap-3 sm:grid">
                    <span />
                    <div className="relative h-5 text-[11px] font-semibold text-texto-suave">
                      {ESCALA.map((n) => (
                        <span key={n} className="absolute -translate-x-1/2" style={{ left: largura(n) }}>{n}</span>
                      ))}
                    </div>
                    <span />
                  </div>
                  <ul className="flex flex-col gap-3.5">
                    {c.notas_ideais.map((n) => {
                      const forte = importantes.has(n.disciplina);
                      return (
                        <li key={n.disciplina} className="grid grid-cols-[1fr_32px] items-center gap-x-3 gap-y-1.5 sm:grid-cols-[minmax(170px,240px)_1fr_32px]">
                          <span className="col-span-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[15px] sm:col-span-1">
                            <span className={forte ? "font-bold" : ""}>{n.disciplina}</span>
                            {forte && <span className="shrink-0 rounded-[4px] border border-primaria/25 bg-primaria-clara px-1.5 py-0.5 text-[11px] font-semibold text-primaria-escura">Mais importante</span>}
                          </span>
                          <div className="h-2 overflow-hidden rounded-full bg-[#eef0f4]">
                            <div className="h-full rounded-full" style={{ width: largura(n.peso_ideal), backgroundColor: forte ? "#17589b" : "#1f6fc0" }} />
                          </div>
                          <span className={`text-right text-[15px] font-bold tabular-nums ${forte ? "text-primaria" : ""}`}>{n.peso_ideal}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-borda pt-4 text-[13px] text-texto-suave">
                    <span className="flex flex-wrap gap-4">
                      <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#17589b]" aria-hidden="true" /> Mais importante para o curso</span>
                      <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#1f6fc0]" aria-hidden="true" /> Disciplina de base</span>
                    </span>
                    <span>Escala de 10 a 20 valores</span>
                  </div>
                </>
              ) : (
                <p className="rounded-[10px] bg-[#fafbfd] px-4 py-3.5 text-[15px] text-texto-suave">Ainda sem notas ideais. Use "Editar curso" para as indicar.</p>
              )}
            </Cartao>
          </div>

          <Cartao className="p-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-[20px] font-semibold">Descrição</h2>
              <IconeCartao icone={BookOpen} />
            </div>
            <p className="text-[16px] leading-relaxed">{c.descricao || <span className="text-texto-suave">Ainda sem descrição.</span>}</p>
          </Cartao>
        </div>
      )}

      {c && (
        <FormularioCurso aberto={editar} curso={c} aoFechar={() => setEditar(false)}
          aoGuardar={() => { setEditar(false); setGuardado(true); recarregar(); }} />
      )}
    </main>
  );
}
