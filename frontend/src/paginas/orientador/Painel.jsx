// Painel do orientador (design Stitch "Njango Edu — Painel"): números
// principais, perfil dominante, cursos mais sugeridos e alunos recentes.

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight, CircleCheck, CirclePause, CirclePlay, Hourglass, Info, RefreshCw, TriangleAlert, Users,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { painelResumo } from "../../api/orientador";
import {
  COR_PERFIL, Cartao, EtiquetaEstado, EtiquetaPerfil, ORDEM_PERFIS, dataCurta, nomeAbreviado, nomeCurtoCurso,
} from "../../componentes/orientador/pecas";
import { useCarregar } from "../../hooks/useCarregar";

const CHAVE_GRAFICOS = "njango.orientador.graficos";

function lerPreferencia(reduzir) {
  try {
    const guardada = localStorage.getItem(CHAVE_GRAFICOS);
    if (guardada === "animados" || guardada === "estaticos") return guardada;
  } catch { /* sem armazenamento: usa o padrão */ }
  return reduzir ? "estaticos" : "animados";
}

function EscolherGraficos({ valor, aoMudar }) {
  const opcoes = [
    ["animados", "Animados", CirclePlay],
    ["estaticos", "Estáticos", CirclePause],
  ];
  return (
    <div role="group" aria-label="Tipo de gráficos" className="inline-flex rounded-[12px] bg-[#eef0fa] p-1">
      {opcoes.map(([id, texto, Icone]) => (
        <button
          key={id}
          type="button"
          aria-pressed={valor === id}
          onClick={() => aoMudar(id)}
          className={`flex h-10 items-center gap-2 rounded-[9px] px-4 text-[14px] font-medium transition-colors ${
            valor === id ? "bg-primaria text-white shadow-sm" : "text-texto hover:bg-white/70"
          }`}
        >
          <Icone className="h-4 w-4" aria-hidden="true" />
          <span className="sm:hidden">{texto}</span>
          <span className="hidden sm:inline">Gráficos {texto.toLowerCase()}</span>
        </button>
      ))}
    </div>
  );
}

function CartaoNumero({ icone: Icone, valor, rotulo, detalhe, destaque = false }) {
  return (
    <Cartao className={`p-4 sm:p-6 ${destaque ? "border-[#fbe3b8]! bg-[#fff4e0]!" : ""}`}>
      <span className={`mb-4 flex h-10 w-10 sm:mb-7 sm:h-12 sm:w-12 items-center justify-center rounded-[10px] ${destaque ? "bg-[#fde0ad] text-[#9a5b00]" : "bg-primaria-clara text-primaria"}`}>
        <Icone className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className={`text-[34px] font-bold leading-none tabular-nums sm:text-[44px] ${destaque ? "text-[#9a5b00]" : ""}`}>{valor}</p>
      <p className={`mt-2 text-[14px] leading-snug sm:mt-3 sm:text-[16px] ${destaque ? "font-semibold text-[#9a5b00]" : "text-texto-suave"}`}>{rotulo}</p>
      {detalhe && <p className="mt-1 text-[13px] text-[#9a5b00]">{detalhe}</p>}
    </Cartao>
  );
}

function Barra({ animar, atraso, children, ...props }) {
  return animar ? (
    <motion.div {...props} transition={{ duration: 0.7, delay: atraso, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>
  ) : (
    <div className={props.className} style={{ ...props.style, ...props.animate }}>{children}</div>
  );
}

function PerfilDominante({ distribuicao, animar }) {
  const total = ORDEM_PERFIS.reduce((s, p) => s + (distribuicao[p] ?? 0), 0);
  const maximo = Math.max(1, ...ORDEM_PERFIS.map((p) => distribuicao[p] ?? 0));
  return (
    <Cartao className="flex flex-col p-6">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[20px] font-semibold">Perfil dominante dos alunos</h2>
        <span className="text-[13px] text-texto-suave">N = {total} com respostas</span>
      </div>
      {total === 0 ? (
        <p className="py-10 text-center text-[15px] text-texto-suave">Ainda nenhum aluno respondeu ao teste.</p>
      ) : (
        <>
          <div className="grid flex-1 grid-cols-4 gap-3 border-b border-borda px-1 sm:gap-8 sm:px-2" role="img"
            aria-label={ORDEM_PERFIS.map((p) => `${p}: ${distribuicao[p] ?? 0}`).join(", ")}>
            {ORDEM_PERFIS.map((p, i) => {
              const n = distribuicao[p] ?? 0;
              return (
                <div key={p} className="flex flex-col items-center">
                  <span className="mb-2 text-[15px] font-bold tabular-nums">{n}</span>
                  <div className="relative flex h-[190px] w-full max-w-[58px] items-end overflow-hidden rounded-t-[8px] bg-[#f1f2fb]">
                    <Barra
                      animar={animar} atraso={0.08 * i}
                      className="w-full rounded-t-[8px]"
                      initial={{ height: 0 }}
                      style={{ backgroundColor: COR_PERFIL[p] }}
                      animate={{ height: `${(n / maximo) * 100}%` }}
                    >
                      <span className="sr-only">{n}</span>
                    </Barra>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3 px-1 text-center text-[11px] text-texto-suave sm:gap-8 sm:px-2 sm:text-[13px]">
            {ORDEM_PERFIS.map((p) => <span key={p} className="truncate">{p}</span>)}
          </div>
          <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 rounded-[10px] bg-[#f7f8fc] p-4 text-[14px] font-medium">
            {ORDEM_PERFIS.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COR_PERFIL[p] }} aria-hidden="true" />
                {p} ({distribuicao[p] ?? 0})
              </li>
            ))}
          </ul>
        </>
      )}
    </Cartao>
  );
}

function CursosMaisSugeridos({ cursos, animar }) {
  const top = cursos.slice(0, 5);
  const maximo = Math.max(1, ...top.map((c) => c.alunos));
  return (
    <Cartao className="flex flex-col p-6">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[20px] font-semibold">Cursos mais sugeridos</h2>
        <span className="text-[13px] text-texto-suave">Top 5 · 1.ª sugestão</span>
      </div>
      {top.length === 0 ? (
        <p className="flex-1 py-10 text-center text-[15px] text-texto-suave">Ainda não há sugestões geradas.</p>
      ) : (
        <ul className="flex flex-1 flex-col gap-5">
          {top.map((c, i) => (
            <li key={`${c.curso}-${c.instituicao}`}>
              <div className="mb-2 flex items-baseline justify-between gap-3 text-[15px]">
                <span className="min-w-0 truncate">
                  <span className="font-semibold">{nomeCurtoCurso(c.curso)}</span>{" "}
                  <span className="text-texto-suave">({c.instituicao})</span>
                </span>
                <span className="font-bold tabular-nums">{c.alunos}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[#eef0fa]">
                <Barra
                  animar={animar} atraso={0.08 * i}
                  className="h-full rounded-full bg-primaria"
                  initial={{ width: 0 }}
                  animate={{ width: `${(c.alunos / maximo) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 flex items-start gap-2 text-[13px] text-texto-suave">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primaria" aria-hidden="true" />
        Conta o curso sugerido em 1.º lugar a cada aluno.
      </p>
    </Cartao>
  );
}

function AlunosRecentes({ alunos }) {
  const navegar = useNavigate();
  const curso = (a) =>
    a.primeira_sugestao ? `${nomeCurtoCurso(a.primeira_sugestao.nome)} (${a.primeira_sugestao.instituicao})` : "—";
  return (
    <Cartao className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[20px] font-semibold">Alunos recentes</h2>
        <Link to="/orientador/alunos" className="flex items-center gap-2 text-[15px] font-semibold text-primaria hover:underline">
          Ver todos os alunos <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      {alunos.length === 0 ? (
        <p className="py-8 text-center text-[15px] text-texto-suave">Ainda nenhum aluno se registou.</p>
      ) : (
        <>
          {/* Computador: tabela */}
          <div className="hidden xl:block">
            <table className="w-full text-left text-[15px]">
              <thead>
                <tr className="bg-[#f3f4fb] text-[12px] font-semibold uppercase tracking-[0.06em] text-texto">
                  <th className="rounded-l-[10px] px-4 py-4 font-semibold">Nome</th>
                  <th className="px-4 py-4 font-semibold">Escola</th>
                  <th className="px-4 py-4 font-semibold">Data</th>
                  <th className="px-4 py-4 font-semibold">Perfil dominante</th>
                  <th className="px-4 py-4 font-semibold">1.º curso sugerido</th>
                  <th className="rounded-r-[10px] px-4 py-4 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {alunos.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => navegar(`/orientador/alunos/${a.id}`)}
                    className="cursor-pointer border-b border-borda/70 last:border-0 hover:bg-[#f7f8fc]"
                  >
                    <td className="px-4 py-5 font-semibold">
                      <Link to={`/orientador/alunos/${a.id}`} onClick={(e) => e.stopPropagation()} className="hover:text-primaria">
                        {nomeAbreviado(a.nome)}
                      </Link>
                    </td>
                    <td className="px-4 py-5 text-texto-suave">{a.escola}</td>
                    <td className="px-4 py-5 tabular-nums text-texto-suave">{dataCurta(a.criado_em)}</td>
                    <td className="px-4 py-5"><EtiquetaPerfil perfil={a.perfil_dominante} /></td>
                    <td className="px-4 py-5">{curso(a)}</td>
                    <td className="px-4 py-5"><EtiquetaEstado estado={a.estado} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Telemóvel: lista */}
          <ul className="flex flex-col divide-y divide-borda xl:hidden">
            {alunos.map((a) => (
              <li key={a.id}>
                <Link to={`/orientador/alunos/${a.id}`} className="flex flex-col gap-2 py-4">
                  <span className="flex items-start justify-between gap-3">
                    <span>
                      <span className="block font-semibold">{nomeAbreviado(a.nome)}</span>
                      <span className="text-[13px] text-texto-suave">{a.escola} · {dataCurta(a.criado_em)}</span>
                    </span>
                    <EtiquetaEstado estado={a.estado} />
                  </span>
                  <span className="flex flex-wrap items-center gap-2 text-[14px]">
                    <EtiquetaPerfil perfil={a.perfil_dominante} />
                    {a.primeira_sugestao && <span className="text-texto-suave">{curso(a)}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </Cartao>
  );
}

function EsqueletoPainel() {
  return (
    <div aria-label="A carregar o painel" className="animate-pulse">
      <div className="mb-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-[210px] rounded-[12px] bg-borda/60" />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-[420px] rounded-[12px] bg-borda/60" />
        <div className="h-[420px] rounded-[12px] bg-borda/60" />
      </div>
    </div>
  );
}

export default function Painel() {
  const { dados, erro, carregando, recarregar } = useCarregar(painelResumo);
  const reduzir = useReducedMotion();
  const [graficos, setGraficos] = useState(() => lerPreferencia(reduzir));

  function mudarGraficos(valor) {
    setGraficos(valor);
    try { localStorage.setItem(CHAVE_GRAFICOS, valor); } catch { /* sem armazenamento */ }
  }

  const animar = graficos === "animados";
  const semCurso = dados?.alunos_sem_curso_compativel ?? 0;

  return (
    <main className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-[32px] font-bold leading-tight tracking-tight lg:text-[36px]">Painel</h1>
          <p className="mt-1 text-[16px] text-texto-suave">Resumo da utilização da plataforma pelos alunos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <EscolherGraficos valor={graficos} aoMudar={mudarGraficos} />
          {dados?.alunos_demonstracao > 0 && (
            <span
              className="rounded-[8px] bg-[#e9ebf2] px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-texto-suave"
              title={`Inclui ${dados.alunos_demonstracao} alunos da "Escola de demonstração" (dados simulados).`}
            >
              Inclui dados de demonstração
            </span>
          )}
        </div>
      </div>

      {carregando && !dados && <EsqueletoPainel />}

      {erro && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-red-50 px-5 py-4 text-[15px] text-red-700">
          <span>Não foi possível carregar o painel. {erro.message}</span>
          <button type="button" onClick={recarregar} className="flex items-center gap-2 font-semibold underline">
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Tentar de novo
          </button>
        </div>
      )}

      {dados && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-6 xl:grid-cols-4">
            <CartaoNumero icone={Users} valor={dados.total_alunos} rotulo="Alunos registados" />
            <CartaoNumero icone={CircleCheck} valor={dados.testes_concluidos} rotulo="Testes concluídos" />
            <CartaoNumero icone={Hourglass} valor={dados.testes_por_terminar} rotulo="Testes por terminar" />
            <CartaoNumero
              icone={TriangleAlert} valor={dados.alunos_a_acompanhar} rotulo="Alunos com pontos de atenção" destaque
              detalhe={semCurso > 0 ? `${semCurso} sem curso compatível` : null}
            />
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <PerfilDominante key={`p-${graficos}`} distribuicao={dados.distribuicao_perfis} animar={animar} />
            <CursosMaisSugeridos key={`c-${graficos}`} cursos={dados.cursos_mais_recomendados} animar={animar} />
          </div>
          <AlunosRecentes alunos={dados.alunos_recentes ?? []} />
        </div>
      )}
    </main>
  );
}
