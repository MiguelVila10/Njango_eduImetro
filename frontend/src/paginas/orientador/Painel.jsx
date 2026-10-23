// Painel do orientador (design Stitch "Njango Edu — Painel", com as ideias
// das referências do utilizador): números com anel, actividade no tempo,
// estado dos alunos, perfil dominante, cursos mais sugeridos e alunos recentes.

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight, CircleCheck, CirclePause, CirclePlay, CircleX, Hourglass, Info, RefreshCw, TriangleAlert, Users,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { painelResumo } from "../../api/orientador";
import {
  COR_PERFIL, Cartao, EtiquetaEstado, EtiquetaPerfil, ORDEM_PERFIS, dataCurta, nomeAbreviado, nomeCurtoCurso,
} from "../../componentes/orientador/pecas";
import { Anel, Donut, GraficoActividade, LegendaDonut } from "../../componentes/orientador/graficos";
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

function Barra({ animar, atraso, children, ...props }) {
  return animar ? (
    <motion.div {...props} transition={{ duration: 0.7, delay: atraso, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>
  ) : (
    <div className={props.className} style={{ ...props.style, ...props.animate }}>{children}</div>
  );
}

function CartaoKPI({ valor, rotulo, detalhe, proporcao, icone, cor = "#1f6fc0", trilho, destaque = false, animar, rotuloAnel }) {
  return (
    <Cartao className={`flex items-center justify-between gap-3 p-4 sm:p-5 ${destaque ? "border-[#fbe3b8]! bg-[#fff4e0]!" : ""}`}>
      <div className="min-w-0">
        <p className={`text-[30px] font-bold leading-none tabular-nums sm:text-[36px] ${destaque ? "text-[#9a5b00]" : ""}`}>{valor}</p>
        <p className={`mt-2 text-[14px] leading-snug sm:text-[15px] ${destaque ? "font-semibold text-[#9a5b00]" : "font-medium"}`}>{rotulo}</p>
        {detalhe && <p className={`mt-1 text-[12px] sm:text-[13px] ${destaque ? "text-[#9a5b00]" : "text-texto-suave"}`}>{detalhe}</p>}
      </div>
      <Anel proporcao={proporcao} icone={icone} cor={cor} trilho={trilho} animar={animar} rotulo={rotuloAnel} />
    </Cartao>
  );
}

const pct = (parte, total) => (total ? Math.round((parte / total) * 100) : 0);
const diaCurto = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });
const diaLongo = (iso) => new Date(`${iso}T12:00:00`).toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" });

// Destaque nos testes concluídos (azul da marca); os registos ficam como contexto, em cinzento.
const SERIES_ACTIVIDADE = [
  { chave: "registados", rotulo: "Alunos registados", cor: "#b8c2d3" },
  { chave: "concluidos", rotulo: "Testes concluídos", cor: "#1f6fc0" },
];

function Actividade({ actividade, animar }) {
  const [vista, setVista] = useState("dias");
  const pontos = vista === "dias"
    ? actividade.dias.map((d) => ({ ...d, chave: d.data, rotulo: diaCurto(d.data), titulo: diaLongo(d.data) }))
    : actividade.semanas.map((s) => ({ ...s, chave: s.inicio, rotulo: diaCurto(s.inicio), titulo: `Semana de ${diaCurto(s.inicio)}` }));
  const totais = SERIES_ACTIVIDADE.map((s) => pontos.reduce((t, p) => t + p[s.chave], 0));
  return (
    <Cartao className="flex flex-col p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[20px] font-semibold">Actividade dos alunos</h2>
          <p className="mt-1 text-[14px] text-texto-suave">
            {vista === "dias" ? "Últimos 14 dias" : "Últimas 8 semanas"}: {totais[0]} registados · {totais[1]} testes concluídos
          </p>
        </div>
        <div role="group" aria-label="Período" className="inline-flex rounded-[10px] border border-borda p-0.5">
          {[["dias", "14 dias"], ["semanas", "8 semanas"]].map(([id, texto]) => (
            <button key={id} type="button" aria-pressed={vista === id} onClick={() => setVista(id)}
              className={`h-9 rounded-[8px] px-3 text-[13px] font-semibold ${vista === id ? "bg-primaria-clara text-primaria" : "text-texto-suave hover:text-texto"}`}>
              {texto}
            </button>
          ))}
        </div>
      </div>
      <ul className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-[13px] font-medium">
        {SERIES_ACTIVIDADE.map((s) => (
          <li key={s.chave} className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-[3px]" style={{ backgroundColor: s.cor }} aria-hidden="true" /> {s.rotulo}
          </li>
        ))}
      </ul>
      <div className="min-h-[240px] flex-1">
        <GraficoActividade key={`${vista}-${animar}`} pontos={pontos} series={SERIES_ACTIVIDADE} animar={animar} />
      </div>
    </Cartao>
  );
}

// Cores do estado sem repetir as dos perfis: cinzentos para o que está normal,
// âmbar (claro e escuro) para quem precisa de atenção. O ícone e o nome vão sempre ao lado.
const PARTES_ESTADO = [
  { id: "concluido", rotulo: "Concluído", cor: "#5b6b85", icone: CircleCheck },
  { id: "ponto_de_atencao", rotulo: "Ponto de atenção", cor: "#e0a100", icone: TriangleAlert },
  { id: "sem_curso_compativel", rotulo: "Sem curso compatível", cor: "#7a4f00", icone: CircleX },
  { id: "por_terminar", rotulo: "Por terminar", cor: "#c5ccd8", icone: Hourglass },
];

function EstadoDosAlunos({ estados, total, animar }) {
  const partes = PARTES_ESTADO.map((p) => ({ ...p, valor: estados?.[p.id] ?? 0 }));
  return (
    <Cartao className="flex flex-col p-5 sm:p-6">
      <h2 className="text-[20px] font-semibold">Estado dos alunos</h2>
      <p className="mb-5 mt-1 text-[14px] text-texto-suave">Em que ponto está cada aluno. Toque num estado para ver os alunos.</p>
      <div className="flex flex-1 flex-col items-center gap-5">
        <Donut partes={partes} centro={total} subcentro={total === 1 ? "aluno" : "alunos"} animar={animar} tamanho={180} rotulo="Estado dos alunos" />
        <LegendaDonut partes={partes} ligacao={(p) => `/orientador/alunos?estado=${p.id}`} />
      </div>
    </Cartao>
  );
}

function PerfilDominante({ distribuicao, animar }) {
  const partes = ORDEM_PERFIS.map((p) => ({ id: p, rotulo: p, valor: distribuicao[p] ?? 0, cor: COR_PERFIL[p] }));
  const total = partes.reduce((s, p) => s + p.valor, 0);
  const maior = [...partes].sort((a, b) => b.valor - a.valor)[0];
  return (
    <Cartao className="flex flex-col p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[20px] font-semibold">Perfil dominante dos alunos</h2>
        <span className="text-[13px] text-texto-suave">N = {total} com respostas</span>
      </div>
      {total === 0 ? (
        <p className="py-10 text-center text-[15px] text-texto-suave">Ainda nenhum aluno respondeu ao teste.</p>
      ) : (
        <>
          <div className="flex flex-1 flex-col items-center justify-center gap-6 sm:flex-row">
            <Donut partes={partes} centro={`${pct(maior.valor, total)}%`} subcentro={maior.rotulo} animar={animar} tamanho={190} rotulo="Perfil dominante dos alunos" />
            <div className="w-full flex-1"><LegendaDonut partes={partes} /></div>
          </div>
          <p className="mt-5 flex items-start gap-2 border-t border-borda pt-4 text-[13px] leading-relaxed text-texto-suave">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primaria" aria-hidden="true" />
            <span>O perfil mais frequente é <strong className="font-semibold text-texto">{maior.rotulo}</strong> ({maior.valor} de {total} alunos com respostas).</span>
          </p>
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
      <p className="mt-5 flex items-start gap-2 border-t border-borda pt-4 text-[13px] leading-relaxed text-texto-suave">
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
                    <td className="whitespace-nowrap px-4 py-5 font-semibold">
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
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-6 xl:grid-cols-4">
            <CartaoKPI animar={animar} key={`k1-${graficos}`} valor={dados.total_alunos} rotulo="Alunos registados" icone={Users}
              proporcao={dados.total_alunos ? dados.alunos_que_escolheram_curso / dados.total_alunos : 0}
              rotuloAnel={`${pct(dados.alunos_que_escolheram_curso, dados.total_alunos)}% já escolheram curso`}
              detalhe={`${dados.alunos_que_escolheram_curso} já ${dados.alunos_que_escolheram_curso === 1 ? "escolheu" : "escolheram"} curso · +${dados.registados_7_dias} em 7 dias`} />
            <CartaoKPI animar={animar} key={`k2-${graficos}`} valor={dados.testes_concluidos} rotulo="Testes concluídos" icone={CircleCheck}
              cor="#1f6fc0" trilho="#e3f0fc" proporcao={dados.total_alunos ? dados.testes_concluidos / dados.total_alunos : 0}
              rotuloAnel={`${pct(dados.testes_concluidos, dados.total_alunos)}% dos alunos`}
              detalhe={`${pct(dados.testes_concluidos, dados.total_alunos)}% dos alunos`} />
            <CartaoKPI animar={animar} key={`k3-${graficos}`} valor={dados.testes_por_terminar} rotulo="Testes por terminar" icone={Hourglass}
              cor="#5b6475" trilho="#eef0f4" proporcao={dados.total_alunos ? dados.testes_por_terminar / dados.total_alunos : 0}
              rotuloAnel={`${pct(dados.testes_por_terminar, dados.total_alunos)}% dos alunos`}
              detalhe={`${pct(dados.testes_por_terminar, dados.total_alunos)}% dos alunos`} />
            <CartaoKPI animar={animar} key={`k4-${graficos}`} valor={dados.alunos_a_acompanhar} rotulo="Alunos com pontos de atenção" icone={TriangleAlert}
              cor="#b26a00" trilho="#fde0ad" destaque
              proporcao={dados.testes_concluidos ? dados.alunos_a_acompanhar / dados.testes_concluidos : 0}
              rotuloAnel={`${pct(dados.alunos_a_acompanhar, dados.testes_concluidos)}% dos testes concluídos`}
              detalhe={semCurso > 0 ? `${semCurso} sem curso compatível` : `${pct(dados.alunos_a_acompanhar, dados.testes_concluidos)}% dos testes concluídos`} />
          </div>
          <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            {dados.actividade && <Actividade actividade={dados.actividade} animar={animar} />}
            <EstadoDosAlunos key={`e-${graficos}`} estados={dados.estados} total={dados.total_alunos} animar={animar} />
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
