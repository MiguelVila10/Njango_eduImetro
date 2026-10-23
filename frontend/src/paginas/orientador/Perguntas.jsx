// Banco de perguntas do teste (design "Njango Edu — Perguntas do teste",
// Frame A): pesquisa, filtros por tipo e situação, linhas que abrem com as
// 4 opções e o perfil de cada uma. RF12: adicionar, editar e desactivar
// (não se apaga, para não perder as respostas dos alunos).

import { ChevronDown, CircleCheck, FileQuestion, Link2, LoaderCircle, Pencil, Plus, Power, RefreshCw, Search } from "lucide-react";
import { Fragment, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { alterarPergunta, listarPerguntas } from "../../api/orientador";
import FormularioPergunta from "../../componentes/orientador/FormularioPergunta";
import { COR_PERFIL, Cartao, ORDEM_PERFIS } from "../../componentes/orientador/pecas";
import { useCarregar } from "../../hooks/useCarregar";

const simplificar = (t = "") => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const NOME_TIPO = { nucleo: "Principal", verificacao: "Verificação" };

function Segmentos({ rotulo, valor, aoMudar, opcoes }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[13px] font-semibold">{rotulo}</span>
      <div role="group" aria-label={rotulo} className="inline-flex flex-wrap rounded-[10px] bg-[#f1f3f6] p-1">
        {opcoes.map(([v, t]) => (
          <button key={v} type="button" aria-pressed={valor === v} onClick={() => aoMudar(v)}
            className={`h-8 rounded-[7px] px-3 text-[13px] transition-colors ${valor === v ? "bg-white font-semibold text-primaria shadow-sm" : "text-texto-suave hover:text-texto"}`}>
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

function EtiquetaTipo({ pergunta }) {
  return (
    <span className="inline-flex flex-wrap gap-1.5">
      <span className={`rounded-[6px] px-2.5 py-1 text-[12px] font-semibold ${pergunta.tipo === "verificacao" ? "bg-[#eef0f4] text-texto-suave" : "bg-primaria-clara text-primaria-escura"}`}>
        {NOME_TIPO[pergunta.tipo] ?? pergunta.tipo}
      </span>
      {!pergunta.ativo && <span className="rounded-[6px] border border-dashed border-[#c5ccd8] px-2.5 py-1 text-[12px] font-semibold text-texto-suave">Desactivada</span>}
    </span>
  );
}

function PontosPerfis() {
  return (
    <span className="flex items-center gap-2 text-[13px] text-texto-suave">
      <span className="flex gap-1" aria-hidden="true">
        {ORDEM_PERFIS.map((p) => <span key={p} className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COR_PERFIL[p] }} />)}
      </span>
      4 perfis
    </span>
  );
}

function Detalhe({ pergunta, numeroPar, aoEditar, aoActivar, aMudar }) {
  const total = pergunta.total_respostas || 0;
  return (
    <div className="bg-[#f4f8fd] px-4 py-5 sm:px-6">
      <p className="mb-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-primaria-escura">Opções de resposta e perfis associados</p>
      <ul className="grid gap-3 md:grid-cols-2">
        {ORDEM_PERFIS.map((perfil) => {
          const opcao = pergunta.opcoes.find((o) => o.arquetipo === perfil);
          const cor = COR_PERFIL[perfil];
          const vezes = pergunta.respostas_por_arquetipo?.[perfil] ?? 0;
          return (
            <li key={perfil} className="flex flex-col gap-2 rounded-[10px] border border-borda bg-white px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <span className="flex items-start gap-2.5 text-[14px]">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: cor }} aria-hidden="true" />
                  {opcao?.texto ?? "—"}
                </span>
                <span className="shrink-0 rounded-[6px] px-2 py-0.5 text-[12px] font-semibold" style={{ color: cor, backgroundColor: `${cor}14` }}>{perfil}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pl-5 text-[12px] text-texto-suave">
                <span>Escolhida {vezes} {vezes === 1 ? "vez" : "vezes"}{total ? ` (${Math.round((vezes / total) * 100)}%)` : ""}</span>
                {pergunta.tendencia === perfil && <span className="font-medium text-[#9a5b00]">Parece a resposta “certa”: conta menos</span>}
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-[13px] text-texto-suave">
          {pergunta.par ? (
            <>
              <Link2 className="h-4 w-4 shrink-0 text-primaria" aria-hidden="true" />
              {pergunta.tipo === "verificacao" ? `Confirma a pergunta n.º ${numeroPar}.` : `É confirmada pela pergunta n.º ${numeroPar}.`}
            </>
          ) : (
            pergunta.tipo === "nucleo" ? "Sem pergunta de verificação ligada." : ""
          )}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => aoActivar(pergunta)} disabled={aMudar}
            className={`flex h-10 items-center gap-2 rounded-[8px] border-[1.5px] px-4 text-[14px] font-semibold ${pergunta.ativo ? "border-borda bg-white text-texto hover:border-[#e0a100] hover:bg-[#fff8eb]" : "border-[#1e8e5a] bg-white text-[#1e7a4f] hover:bg-[#e7f4ec]"}`}>
            {aMudar ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Power className="h-4 w-4" aria-hidden="true" />}
            {pergunta.ativo ? "Desactivar" : "Activar"}
          </button>
          <button type="button" onClick={() => aoEditar(pergunta)}
            className="flex h-10 items-center gap-2 rounded-[8px] border-[1.5px] border-primaria bg-white px-4 text-[14px] font-semibold text-primaria hover:bg-primaria-clara">
            <Pencil className="h-4 w-4" aria-hidden="true" /> Editar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Perguntas() {
  const { dados, erro, carregando, recarregar } = useCarregar(listarPerguntas);
  const [params, setParams] = useSearchParams();
  const [aberta, setAberta] = useState(null);
  const [formulario, setFormulario] = useState({ aberto: false, pergunta: null });
  const [aviso, setAviso] = useState(null);
  const [aMudar, setAMudar] = useState(null);
  const [erroAccao, setErroAccao] = useState(null);
  const pesquisa = params.get("q") ?? "";
  const tipo = params.get("tipo") ?? "";
  const situacao = params.get("situacao") ?? "";

  function mudar(chave, valor) {
    const novos = new URLSearchParams(params);
    if (valor) novos.set(chave, valor); else novos.delete(chave);
    setParams(novos, { replace: true });
  }

  // Numeração fixa (ordem do banco), igual com ou sem filtros.
  const numeradas = useMemo(() => {
    const ordenadas = [...(dados ?? [])].sort((a, b) => (a.posicao ?? 999) - (b.posicao ?? 999) || a.id - b.id);
    return ordenadas.map((q, i) => ({ ...q, numero: i + 1 }));
  }, [dados]);
  const numeroDe = useMemo(() => Object.fromEntries(numeradas.map((q) => [q.id, q.numero])), [numeradas]);

  const filtradas = useMemo(() => {
    const q = simplificar(pesquisa.trim());
    return numeradas.filter((p) =>
      (!q || simplificar(p.texto).includes(q) || p.opcoes.some((o) => simplificar(o.texto).includes(q)))
      && (!tipo || p.tipo === tipo)
      && (!situacao || p.tendencia === situacao));
  }, [numeradas, pesquisa, tipo, situacao]);

  const activas = numeradas.filter((q) => q.ativo).length;

  async function activar(pergunta) {
    setAMudar(pergunta.id); setErroAccao(null);
    try {
      await alterarPergunta(pergunta.id, { ativo: !pergunta.ativo });
      setAviso(pergunta.ativo ? `Pergunta n.º ${pergunta.numero} desactivada: deixa de aparecer no teste. As respostas ficam guardadas.`
        : `Pergunta n.º ${pergunta.numero} activada: volta a poder aparecer no teste.`);
      await recarregar();
    } catch (e) {
      setErroAccao(e.message);
    } finally {
      setAMudar(null);
    }
  }

  function guardada(p) {
    const editada = Boolean(formulario.pergunta);
    setFormulario({ aberto: false, pergunta: null });
    setAviso(editada ? "Pergunta actualizada." : "Pergunta adicionada. Já pode aparecer no teste dos próximos alunos.");
    setAberta(p.id);
    recarregar();
  }

  return (
    <main className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight lg:text-[32px]">Perguntas do teste</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-texto-suave">
            Banco de perguntas usado no teste. O sistema escolhe a pergunta seguinte de acordo com as respostas anteriores do aluno.
          </p>
        </div>
        <button type="button" onClick={() => setFormulario({ aberto: true, pergunta: null })}
          className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-[8px] bg-primaria px-5 text-[15px] font-semibold text-white hover:bg-primaria-escura">
          <Plus className="h-5 w-5" aria-hidden="true" /> Adicionar pergunta
        </button>
      </header>

      {aviso && (
        <p role="status" className="mb-6 flex items-center gap-2 rounded-[12px] bg-emerald-50 px-5 py-4 text-[15px] font-medium text-emerald-800">
          <CircleCheck className="h-5 w-5 shrink-0" aria-hidden="true" /> {aviso}
        </p>
      )}
      {(erro || erroAccao) && (
        <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-red-50 px-5 py-4 text-[15px] text-red-700">
          <span>{erroAccao ?? `Não foi possível carregar as perguntas. ${erro.message}`}</span>
          {erro && <button type="button" onClick={recarregar} className="flex items-center gap-2 font-semibold underline"><RefreshCw className="h-4 w-4" aria-hidden="true" /> Tentar de novo</button>}
        </div>
      )}

      <Cartao className="mb-6 p-4 sm:p-5">
        <div className="flex flex-col gap-3 border-b border-borda pb-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative sm:w-[340px]">
            <span className="sr-only">Pesquisar pergunta</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-texto-suave" aria-hidden="true" />
            <input type="search" value={pesquisa} onChange={(e) => mudar("q", e.target.value)} placeholder="Pesquisar pergunta"
              className="h-11 w-full rounded-[10px] border border-borda bg-white pl-11 pr-4 text-[14px] placeholder:text-texto-suave focus:border-primaria focus:outline-none focus:ring-1 focus:ring-primaria" />
          </label>
          {dados && (
            <p className="text-[14px] text-texto-suave" aria-live="polite">
              <strong className="font-semibold text-texto">{filtradas.length} {filtradas.length === 1 ? "pergunta" : "perguntas"}</strong>
              {" "}· {activas} activas no teste
            </p>
          )}
        </div>
        <div className="flex flex-col gap-3 pt-4 lg:flex-row lg:flex-wrap lg:items-center lg:gap-6">
          <Segmentos rotulo="Tipo:" valor={tipo} aoMudar={(v) => mudar("tipo", v)}
            opcoes={[["", "Todos"], ["nucleo", "Principal"], ["verificacao", "Verificação"]]} />
          <Segmentos rotulo="Situação mais ligada a:" valor={situacao} aoMudar={(v) => mudar("situacao", v)}
            opcoes={[["", "Todos"], ...ORDEM_PERFIS.map((p) => [p, p])]} />
        </div>
      </Cartao>

      {carregando && !dados && <div className="h-[420px] animate-pulse rounded-[12px] bg-borda/60" aria-label="A carregar as perguntas" />}

      {dados && (
        <Cartao className="overflow-hidden">
          {filtradas.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <FileQuestion className="mb-3 h-10 w-10 text-texto-suave" aria-hidden="true" />
              <p className="text-[17px] font-bold">{numeradas.length ? "Nenhuma pergunta com estes filtros" : "Ainda não há perguntas no banco"}</p>
              {numeradas.length > 0 && (
                <button type="button" onClick={() => setParams({}, { replace: true })} className="mt-3 text-[15px] font-semibold text-primaria hover:underline">
                  Limpar a pesquisa e os filtros
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden grid-cols-[56px_1fr_150px_130px_120px_44px] items-center gap-3 border-b border-borda px-4 py-3 text-[13px] font-bold md:grid">
                <span>N.º</span><span>Pergunta</span><span>Tipo</span><span>Opções</span><span className="text-right">Vezes respondida</span><span />
              </div>
              <ul className="divide-y divide-borda">
                {filtradas.map((p) => {
                  const estaAberta = aberta === p.id;
                  return (
                    <Fragment key={p.id}>
                      <li className={p.ativo ? "" : "bg-[#fafbfc]"}>
                        <button type="button" onClick={() => setAberta(estaAberta ? null : p.id)} aria-expanded={estaAberta}
                          className={`grid w-full grid-cols-[40px_1fr_28px] items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-primaria-clara/50 md:grid-cols-[56px_1fr_150px_130px_120px_44px] ${estaAberta ? "bg-[#f4f8fd]" : ""}`}>
                          <span className="text-[14px] font-semibold tabular-nums text-texto-suave">{p.numero}</span>
                          <span className="min-w-0">
                            <span className={`line-clamp-2 text-[15px] md:line-clamp-1 ${p.ativo ? "" : "text-texto-suave"}`}>{p.texto}</span>
                            <span className="mt-1.5 flex flex-wrap items-center gap-2 md:hidden">
                              <EtiquetaTipo pergunta={p} />
                              <span className="text-[12px] text-texto-suave">{p.total_respostas} respostas</span>
                            </span>
                          </span>
                          <span className="hidden md:block"><EtiquetaTipo pergunta={p} /></span>
                          <span className="hidden md:block"><PontosPerfis /></span>
                          <span className="hidden text-right text-[15px] font-semibold tabular-nums md:block">{p.total_respostas}</span>
                          <ChevronDown className={`h-5 w-5 justify-self-end text-texto-suave transition-transform ${estaAberta ? "rotate-180 text-primaria" : ""}`} aria-hidden="true" />
                        </button>
                        {estaAberta && (
                          <Detalhe pergunta={p} numeroPar={p.par ? numeroDe[p.par.id] : null} aMudar={aMudar === p.id}
                            aoEditar={(q) => setFormulario({ aberto: true, pergunta: q })} aoActivar={activar} />
                        )}
                      </li>
                    </Fragment>
                  );
                })}
              </ul>
            </>
          )}
        </Cartao>
      )}

      <FormularioPergunta aberto={formulario.aberto} pergunta={formulario.pergunta}
        principais={numeradas.filter((q) => q.tipo === "nucleo")}
        aoFechar={() => setFormulario({ aberto: false, pergunta: null })} aoGuardar={guardada} />
    </main>
  );
}
