// Ficha de um aluno para o orientador (design "Njango Edu — Detalhe do
// aluno"): cabeçalho, ponto de atenção, sugestões e escolha, perfil nas
// respostas, notas do certificado e respostas do teste. Só consulta.

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, CircleCheck, RefreshCw, TriangleAlert, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { DISCIPLINAS } from "../../api/aluno";
import { fichaAluno } from "../../api/orientador";
import { PerfilSemSugestao, juntar, nomePerfis } from "../../componentes/explicacao";
import {
  AvisoDemonstracao, COR_PERFIL, Cartao, ESCOLA_DEMO, EtiquetaEstado, ORDEM_PERFIS, dataCurta, nomeCurtoCurso,
} from "../../componentes/orientador/pecas";
import { useCarregar } from "../../hooks/useCarregar";

const pct = (v) => `${Math.round((v ?? 0) * 100)}%`;
const iniciais = (nome = "") => nome.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
const nota1 = (v) => (v == null ? "—" : v.toLocaleString("pt-PT", { maximumFractionDigits: 1 }));

// ---------- Ponto de atenção ----------

function textosPontoDeAtencao(a) {
  const textos = [];
  for (const p of a.pontos_de_atencao ?? []) {
    const lista = juntar((p.disciplinas ?? []).map((d) => `${d.disciplina} (${d.nota ?? "—"})`));
    if (p.tipo === "sobrestimacao") {
      textos.push(
        `Nas respostas ao teste, o perfil ${p.perfil} aparece muitas vezes. No entanto, as notas das disciplinas ligadas a este perfil — ${lista} — estão abaixo da média do aluno (${nota1(p.media_aluno)}). Pode valer a pena conversar com o aluno sobre esta área e sobre como melhorar nestas disciplinas.`,
      );
    } else if (p.tipo === "subestimacao") {
      textos.push(
        `As notas das disciplinas ligadas ao perfil ${p.perfil} — ${lista} — estão acima da média do aluno (${nota1(p.media_aluno)}), mas o aluno quase não escolheu este perfil no teste. Pode ser uma área forte que o aluno ainda não valoriza; vale a pena falar sobre ela.`,
      );
    } else if (p.tipo === "confianca_baixa") {
      const motivos = (p.motivos ?? []).map((m) => m.replace(/\.$/, "").toLowerCase());
      textos.push(
        `As respostas ao teste podem não mostrar bem o aluno${motivos.length ? `: ${juntar(motivos)}` : ""}. Vale a pena confirmar as preferências do aluno numa conversa.`,
      );
    }
  }
  if (a.estado === "sem_curso_compativel") {
    textos.unshift(
      "As notas do aluno ainda não chegam à nota mínima de nenhum curso, por isso não houve sugestões. Os cursos que ficaram mais perto estão em \"Sugestões e escolha\", com as disciplinas que faltam.",
    );
  }
  return textos;
}

function PontoDeAtencao({ textos }) {
  if (!textos.length) return null;
  return (
    <section className="rounded-[12px] border border-[#fbe3b8] border-l-4 border-l-[#b26a00] bg-[#fff4e0] p-5 sm:p-6">
      <h2 className="mb-2 flex items-center gap-3 text-[18px] font-semibold text-[#9a5b00]">
        <TriangleAlert className="h-5 w-5 shrink-0" aria-hidden="true" /> Ponto de atenção
      </h2>
      <div className="flex flex-col gap-2 text-[15px] leading-relaxed text-texto sm:pl-8">
        {textos.map((t) => <p key={t}>{t}</p>)}
        <p className="text-[14px] text-texto-suave">Esta indicação serve para apoiar a conversa. Não é um diagnóstico.</p>
      </div>
    </section>
  );
}

// ---------- Sugestões e escolha ----------

function BarraFina({ rotulo, valor, cor }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 flex justify-between text-[13px]">
        <span className="text-texto-suave">{rotulo}</span>
        <span className="font-semibold tabular-nums">{pct(valor)}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#eef0f4]">
        <div className="h-full rounded-full" style={{ width: pct(valor), backgroundColor: cor }} />
      </div>
    </div>
  );
}

function Sugestao({ s }) {
  const escolhida = s.escolhida_pelo_aluno;
  return (
    <li className={`rounded-[12px] border p-4 ${escolhida ? "border-[1.5px] border-[#1e8e5a] bg-[#e7f4ec]" : "border-borda bg-white"}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="flex flex-wrap items-center gap-2 text-[16px] font-semibold">
          <span>{s.rank}.º {nomeCurtoCurso(s.nome)} — {s.instituicao}</span>
          {escolhida && (
            <span className="inline-flex items-center gap-1 rounded-[6px] bg-[#1e8e5a] px-2 py-0.5 text-[12px] font-semibold text-white">
              <Check className="h-3.5 w-3.5" aria-hidden="true" /> Escolhido pelo aluno
            </span>
          )}
        </p>
        <span className={`text-[16px] font-semibold ${escolhida ? "text-[#1e8e5a]" : ""}`}>Final {pct(s.score_final)}</span>
      </div>
      <div className="flex gap-4">
        <BarraFina rotulo="Notas" valor={s.score_academico} cor="#1f6fc0" />
        <BarraFina rotulo="Perfil" valor={s.score_psicografico} cor={COR_PERFIL[s.arquetipo] ?? "#1e8e5a"} />
      </div>
    </li>
  );
}

function CursoProximo({ c }) {
  return (
    <li className="rounded-[12px] border border-borda p-4">
      <p className="mb-1 text-[16px] font-semibold">{nomeCurtoCurso(c.curso_nome)} — {c.curso_instituicao}</p>
      <p className="text-[14px] text-texto-suave">
        Falta: {juntar(c.faltas.map((f) => `${f.disciplina} ${f.nota} (mín. ${f.nota_min})`))}
      </p>
    </li>
  );
}

function SugestoesEEscolha({ a }) {
  let corpo;
  let rodape = null;
  if (a.sugestoes.length) {
    corpo = <ul className="flex flex-col gap-3">{a.sugestoes.map((s) => <Sugestao key={s.rank} s={s} />)}</ul>;
    rodape = a.curso_escolhido ? "Escolha registada pelo aluno." : "O aluno ainda não escolheu um curso.";
  } else if (a.cursos_proximos.length) {
    corpo = (
      <>
        <p className="mb-3 text-[15px] font-medium">Nenhum curso compatível. Cursos mais perto:</p>
        <ul className="flex flex-col gap-3">{a.cursos_proximos.map((c) => <CursoProximo key={c.curso} c={c} />)}</ul>
      </>
    );
  } else {
    corpo = <p className="py-6 text-[15px] text-texto-suave">Ainda sem sugestões: o aluno não terminou as notas e o teste.</p>;
  }
  return (
    <Cartao className="flex flex-col p-5 sm:p-6">
      <h2 className="text-[20px] font-semibold">Sugestões e escolha</h2>
      <p className="mb-5 mt-1 text-[14px] text-texto-suave">Pontuação final = 60% compatibilidade com as notas + 40% afinidade com o perfil.</p>
      <div className="flex-1">{corpo}</div>
      {a.sugestoes.length > 0 && <PerfilSemSugestao perfil={a.perfil_respostas} quem="orientador" className="mt-4" />}
      {rodape && <p className="mt-5 border-t border-borda pt-4 text-[14px] text-texto-suave">{rodape}</p>}
    </Cartao>
  );
}

// ---------- Perfil nas respostas ----------

function PerfilNasRespostas({ a }) {
  const { total, arquetipos, dominantes = [] } = a.perfil_respostas;
  // O mesmo critério das barras (respostas em cada perfil); em empate mostram-se todos.
  const dominante = dominantes.length ? nomePerfis(dominantes) : a.perfil_dominante;
  const cor = dominantes.length > 1 ? "#5b6475" : (COR_PERFIL[dominantes[0] ?? a.perfil_dominante] ?? "#5b6475");
  return (
    <Cartao className="flex flex-col p-5 sm:p-6">
      <h2 className="mb-5 text-[20px] font-semibold">Perfil nas respostas</h2>
      {total === 0 ? (
        <p className="py-6 text-[15px] text-texto-suave">O aluno ainda não respondeu ao teste.</p>
      ) : (
        <>
          <p className="mb-6 rounded-[8px] border px-4 py-3 text-[15px] font-semibold" style={{ color: cor, borderColor: `${cor}55`, backgroundColor: `${cor}14` }}>
            Perfil dominante: {dominante}
          </p>
          <ul className="flex flex-1 flex-col gap-5">
            {arquetipos.map((p) => (
              <li key={p.arquetipo}>
                <div className="mb-2 flex justify-between text-[15px] font-semibold">
                  <span>{p.arquetipo}</span>
                  <span className="tabular-nums" style={{ color: COR_PERFIL[p.arquetipo] }}>{pct(p.percentagem)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#eef0f4]">
                  <div className="h-full rounded-full" style={{ width: pct(p.percentagem), backgroundColor: COR_PERFIL[p.arquetipo] }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[13px] text-texto-suave">Percentagem das {total} respostas ao teste em cada perfil.</p>
          <ul className="mt-4 grid grid-cols-2 gap-2 border-t border-borda pt-4 text-[13px] text-texto-suave">
            {ORDEM_PERFIS.map((p) => (
              <li key={p} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COR_PERFIL[p] }} aria-hidden="true" /> {p}
              </li>
            ))}
          </ul>
        </>
      )}
    </Cartao>
  );
}

// ---------- Notas ----------

function Notas({ a }) {
  const valores = Object.values(a.notas);
  const media = valores.length ? valores.reduce((s, v) => s + v, 0) / valores.length : null;
  // Disciplinas apontadas no ponto de atenção com nota abaixo da média do aluno.
  const atencao = new Set(
    (a.pontos_de_atencao ?? [])
      .filter((p) => p.tipo === "sobrestimacao")
      .flatMap((p) => p.disciplinas)
      .filter((d) => d.nota != null && media != null && d.nota < media)
      .map((d) => d.disciplina),
  );
  return (
    <Cartao className="p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[20px] font-semibold">Notas do certificado</h2>
        {media != null && (
          <span className="rounded-[8px] border border-primaria/25 bg-primaria-clara px-3 py-1.5 text-[15px] font-semibold text-primaria">
            Média: {nota1(media)}
          </span>
        )}
      </div>
      {valores.length === 0 ? (
        <p className="py-6 text-[15px] text-texto-suave">O aluno ainda não escreveu as notas.</p>
      ) : (
        <ul className="grid gap-2.5 sm:grid-flow-col sm:grid-cols-2 sm:grid-rows-6 sm:gap-x-6">
          {DISCIPLINAS.map((d) => {
            const destaque = atencao.has(d);
            return (
              <li key={d} className={`flex items-center justify-between gap-3 rounded-[8px] border px-3 py-2.5 text-[15px] ${destaque ? "border-[#fbd28a] bg-[#fff4e0] font-semibold text-[#9a5b00]" : "border-borda"}`}>
                <span className="truncate" title={d}>{d}</span>
                <span className="flex items-center gap-1.5 font-semibold tabular-nums">
                  {destaque && <TriangleAlert className="h-4 w-4" aria-label="Nota a acompanhar" />}
                  {a.notas[d] ?? "—"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Cartao>
  );
}

// ---------- Respostas do teste ----------

function Resposta({ r, curta = false }) {
  const cor = COR_PERFIL[r.arquetipo];
  const pergunta = curta && r.pergunta.length > 48 ? `${r.pergunta.slice(0, 46).trimEnd()}…` : r.pergunta;
  return (
    <li className="rounded-[10px] border border-borda p-4">
      <p className="text-[15px] font-semibold">{r.numero}. “{pergunta}”</p>
      <p className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[14px] text-texto-suave">
        <span>→ “{r.resposta || "—"}”</span>
        <span className="rounded-[6px] px-2 py-0.5 text-[12px] font-semibold" style={{ color: cor, backgroundColor: `${cor}14` }}>({r.arquetipo})</span>
      </p>
    </li>
  );
}

function JanelaRespostas({ respostas, aoFechar }) {
  const fechar = useRef(null);
  useEffect(() => {
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    fechar.current?.focus();
    const tecla = (e) => e.key === "Escape" && aoFechar();
    document.addEventListener("keydown", tecla);
    return () => { document.body.style.overflow = antes; document.removeEventListener("keydown", tecla); };
  }, [aoFechar]);
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-texto/40 sm:items-center sm:p-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && aoFechar()}>
      <motion.div role="dialog" aria-modal="true" aria-labelledby="respostas-titulo"
        className="flex max-h-[90vh] w-full flex-col rounded-t-[16px] bg-white shadow-[0_16px_36px_rgba(37,43,66,0.12)] sm:max-w-[720px] sm:rounded-[16px]"
        initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}>
        <div className="flex items-center justify-between border-b border-borda px-5 py-4 sm:px-6">
          <h2 id="respostas-titulo" className="text-[20px] font-semibold">Respostas do teste ({respostas.length})</h2>
          <button ref={fechar} type="button" onClick={aoFechar} aria-label="Fechar"
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-fundo">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <ul className="flex flex-col gap-3 overflow-y-auto px-5 py-5 sm:px-6">
          {respostas.map((r) => <Resposta key={r.numero} r={r} />)}
        </ul>
      </motion.div>
    </motion.div>
  );
}

function RespostasDoTeste({ respostas }) {
  const [aberta, setAberta] = useState(false);
  return (
    <Cartao className="flex flex-col p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[20px] font-semibold">Respostas do teste</h2>
        <span className="text-[14px] text-texto-suave">
          {respostas.length} {respostas.length === 1 ? "pergunta respondida" : "perguntas respondidas"}
        </span>
      </div>
      {respostas.length === 0 ? (
        <p className="py-6 text-[15px] text-texto-suave">O aluno ainda não respondeu ao teste.</p>
      ) : (
        <>
          <ul className="flex flex-1 flex-col gap-3">{respostas.slice(0, 3).map((r) => <Resposta key={r.numero} r={r} curta />)}</ul>
          {respostas.length > 3 && (
            <div className="mt-5 border-t border-borda pt-4">
              <button type="button" onClick={() => setAberta(true)} className="text-[15px] font-semibold text-primaria hover:underline">
                Ver as {respostas.length} respostas
              </button>
            </div>
          )}
        </>
      )}
      <AnimatePresence>{aberta && <JanelaRespostas respostas={respostas} aoFechar={() => setAberta(false)} />}</AnimatePresence>
    </Cartao>
  );
}

// ---------- Página ----------

export default function FichaAluno() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { key } = useLocation();
  const { dados: a, erro, carregando, recarregar } = useCarregar(() => fichaAluno(id), [id]);

  // Voltar mantém a pesquisa e os filtros da lista (volta no histórico quando se veio de lá).
  function voltar(e) {
    if (key !== "default") { e.preventDefault(); navegar(-1); }
  }

  return (
    <main className="mx-auto w-full max-w-[1160px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link to="/orientador/alunos" onClick={voltar} className="inline-flex items-center gap-2 text-[15px] font-medium text-primaria hover:underline">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar à lista de alunos
        </Link>
        {a?.escola === ESCOLA_DEMO && <AvisoDemonstracao />}
      </div>

      {carregando && !a && <div className="h-[520px] animate-pulse rounded-[12px] bg-borda/60" aria-label="A carregar a ficha" />}
      {erro && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-red-50 px-5 py-4 text-[15px] text-red-700">
          <span>{erro.status === 404 ? "Este aluno não existe." : `Não foi possível carregar a ficha. ${erro.message}`}</span>
          {erro.status !== 404 && (
            <button type="button" onClick={recarregar} className="flex items-center gap-2 font-semibold underline">
              <RefreshCw className="h-4 w-4" aria-hidden="true" /> Tentar de novo
            </button>
          )}
        </div>
      )}

      {a && (
        <div className="flex flex-col gap-6">
          <Cartao className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primaria-clara text-[22px] font-bold text-primaria">
                {iniciais(a.nome)}
              </span>
              <div className="min-w-0">
                <h1 className="text-[26px] font-bold leading-tight">{a.nome}</h1>
                <p className="mt-1 text-[15px] text-texto-suave">
                  {a.idade} anos · {a.escola} · {a.teste_feito_em ? `Teste feito a ${dataCurta(a.teste_feito_em)}` : "Teste por terminar"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <EtiquetaEstado estado={a.estado} quadrada />
              {a.sugestoes.length > 0 && (
                a.curso_escolhido ? (
                  <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-emerald-50 px-3 py-1 text-[13px] font-semibold text-emerald-700">
                    <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" /> Escolheu um curso
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-[6px] bg-[#eef0f7] px-3 py-1 text-[13px] font-semibold text-texto-suave">
                    Ainda não decidiu
                  </span>
                )
              )}
            </div>
          </Cartao>

          <PontoDeAtencao textos={textosPontoDeAtencao(a)} />

          <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
            <SugestoesEEscolha a={a} />
            <PerfilNasRespostas a={a} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Notas a={a} />
            <RespostasDoTeste respostas={a.respostas_teste} />
          </div>
        </div>
      )}
    </main>
  );
}
