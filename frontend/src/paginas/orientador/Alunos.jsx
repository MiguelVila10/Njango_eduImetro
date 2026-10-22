// Lista de alunos do orientador (design "Njango Edu — Gestão de alunos"):
// pesquisa, filtros por estado, escolha e perfil, tabela e páginas.
// Clicar num aluno abre a ficha. Os filtros ficam no endereço, por isso
// voltar da ficha mantém a lista como estava.

import { ChevronDown, ChevronRight, RefreshCw, Search, Users } from "lucide-react";
import { useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { listarAlunos } from "../../api/orientador";
import {
  AvisoDemonstracao, Cartao, ESCOLA_DEMO, ESTADOS, EtiquetaEstado, EtiquetaPerfil, ORDEM_PERFIS,
  dataCurta, nomeAbreviado, nomeCurtoCurso,
} from "../../componentes/orientador/pecas";
import { useCarregar } from "../../hooks/useCarregar";

export const NOME_ESTADO = Object.fromEntries(Object.entries(ESTADOS).map(([id, e]) => [id, e.texto]));

const POR_PAGINA = 8;
const ORDEM_ESTADOS = ["concluido", "ponto_de_atencao", "sem_curso_compativel", "por_terminar"];

// Para a pesquisa ignorar maiúsculas e acentos ("joao" encontra "João").
const simplificar = (t = "") => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const curso = (c) => (c ? `${nomeCurtoCurso(c.nome)} (${c.instituicao})` : null);

function Filtro({ rotulo, valor, aoMudar, opcoes }) {
  return (
    <div className="relative">
      <select
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        aria-label={rotulo}
        className="h-12 w-full cursor-pointer appearance-none rounded-[12px] border border-borda bg-white pl-3.5 pr-9 text-[14px] font-medium text-texto shadow-xs focus:border-primaria focus:outline-none focus:ring-1 focus:ring-primaria"
      >
        <option value="">{rotulo}: Todos</option>
        {opcoes.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-suave" aria-hidden="true" />
    </div>
  );
}

function CursoEscolhido({ aluno }) {
  const c = aluno.curso_escolhido;
  if (c) {
    return (
      <span className="flex flex-col items-start gap-1">
        <span className="font-medium">{curso(c)}</span>
        {c.rank && (
          <span className="whitespace-nowrap rounded-[4px] border border-primaria/20 bg-primaria-clara px-2 py-0.5 text-[11px] font-semibold text-primaria-escura">
            {c.rank}.ª sugestão
          </span>
        )}
      </span>
    );
  }
  return <span className="text-texto-suave">{aluno.primeira_sugestao ? "Ainda não decidiu" : "—"}</span>;
}

function Paginas({ pagina, total, aoMudar }) {
  if (total <= 1) return null;
  // 1 2 3 … 6: primeira, última e as vizinhas da actual
  const numeros = [...new Set([1, pagina - 1, pagina, pagina + 1, total])].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const itens = numeros.flatMap((n, i) => (i > 0 && n - numeros[i - 1] > 1 ? ["…", n] : [n]));
  const botao = "flex h-9 min-w-9 items-center justify-center rounded-[8px] px-2 text-[14px] font-semibold";
  return (
    <nav aria-label="Páginas" className="flex items-center gap-1">
      <button type="button" disabled={pagina === 1} onClick={() => aoMudar(pagina - 1)}
        className={`${botao} text-texto-suave enabled:hover:bg-fundo disabled:opacity-50`}>‹ Anterior</button>
      {itens.map((n, i) => n === "…" ? (
        <span key={`r${i}`} className="px-1 text-texto-suave">…</span>
      ) : (
        <button key={n} type="button" onClick={() => aoMudar(n)} aria-current={n === pagina ? "page" : undefined}
          className={`${botao} ${n === pagina ? "bg-primaria text-white" : "text-texto hover:bg-fundo"}`}>{n}</button>
      ))}
      <button type="button" disabled={pagina === total} onClick={() => aoMudar(pagina + 1)}
        className={`${botao} text-texto enabled:hover:bg-fundo disabled:opacity-50`}>Seguinte ›</button>
    </nav>
  );
}

export default function Alunos() {
  const navegar = useNavigate();
  const { dados, erro, carregando, recarregar } = useCarregar(listarAlunos);
  const [params, setParams] = useSearchParams();
  const pesquisa = params.get("q") ?? "";
  const estado = params.get("estado") ?? "";
  const escolha = params.get("escolha") ?? "";
  const perfil = params.get("perfil") ?? "";
  const pagina = Math.max(1, Number(params.get("pagina")) || 1);

  function mudar(chave, valor) {
    const novos = new URLSearchParams(params);
    if (valor) novos.set(chave, valor);
    else novos.delete(chave);
    if (chave !== "pagina") novos.delete("pagina");
    setParams(novos, { replace: true });
  }

  const filtrados = useMemo(() => {
    const q = simplificar(pesquisa.trim());
    return (dados ?? []).filter((a) => {
      if (q && !simplificar(a.nome).includes(q) && !simplificar(a.escola).includes(q)) return false;
      if (estado && a.estado !== estado) return false;
      if (escolha === "escolheu" && !a.curso_escolhido) return false;
      if (escolha === "indeciso" && (a.curso_escolhido || !a.primeira_sugestao)) return false;
      if (perfil && a.perfil_dominante !== perfil) return false;
      return true;
    });
  }, [dados, pesquisa, estado, escolha, perfil]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * POR_PAGINA;
  const visiveis = filtrados.slice(inicio, inicio + POR_PAGINA);
  const temDemo = (dados ?? []).some((a) => a.escola === ESCOLA_DEMO);
  const comFiltros = Boolean(pesquisa || estado || escolha || perfil);

  return (
    <main className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[28px] font-bold leading-tight tracking-tight lg:text-[32px]">Alunos</h1>
          {temDemo && <AvisoDemonstracao />}
        </div>
        <p className="mt-2 max-w-3xl text-[15px] leading-relaxed text-texto-suave">
          Todos os alunos que usaram a plataforma. Clique num aluno para ver as notas, as respostas e as sugestões.
        </p>
      </header>

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
          <label className="relative sm:col-span-2 lg:w-[280px]">
            <span className="sr-only">Pesquisar por nome ou escola</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-texto-suave" aria-hidden="true" />
            <input
              type="search"
              value={pesquisa}
              onChange={(e) => mudar("q", e.target.value)}
              placeholder="Pesquisar nome ou escola"
              className="h-12 w-full rounded-[12px] border border-borda bg-white pl-11 pr-4 text-[14px] placeholder:text-texto-suave shadow-xs focus:border-primaria focus:outline-none focus:ring-1 focus:ring-primaria"
            />
          </label>
          <Filtro rotulo="Estado" valor={estado} aoMudar={(v) => mudar("estado", v)}
            opcoes={ORDEM_ESTADOS.map((e) => [e, NOME_ESTADO[e]])} />
          <Filtro rotulo="Escolha" valor={escolha} aoMudar={(v) => mudar("escolha", v)}
            opcoes={[["escolheu", "Escolheu um curso"], ["indeciso", "Ainda não decidiu"]]} />
          <Filtro rotulo="Perfil dominante" valor={perfil} aoMudar={(v) => mudar("perfil", v)}
            opcoes={ORDEM_PERFIS.map((p) => [p, p])} />
        </div>
        {dados && (
          <p className="text-[15px] text-texto-suave" aria-live="polite">
            {filtrados.length} {filtrados.length === 1 ? "aluno" : "alunos"}
          </p>
        )}
      </div>

      {erro && (
        <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-red-50 px-5 py-4 text-[15px] text-red-700">
          <span>Não foi possível carregar os alunos. {erro.message}</span>
          <button type="button" onClick={recarregar} className="flex items-center gap-2 font-semibold underline">
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Tentar de novo
          </button>
        </div>
      )}

      {carregando && !dados && <div className="h-[460px] animate-pulse rounded-[12px] bg-borda/60" aria-label="A carregar os alunos" />}

      {dados && (
        <Cartao className="overflow-hidden">
          {visiveis.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <Users className="mb-3 h-10 w-10 text-texto-suave" aria-hidden="true" />
              <p className="text-[17px] font-bold">{comFiltros ? "Nenhum aluno com estes filtros" : "Ainda nenhum aluno se registou"}</p>
              {comFiltros && (
                <button type="button" onClick={() => setParams({}, { replace: true })} className="mt-3 text-[15px] font-semibold text-primaria hover:underline">
                  Limpar a pesquisa e os filtros
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Computador: tabela */}
              <div className="hidden overflow-x-auto min-[1400px]:block">
                <table className="w-full text-left">
                  <thead>
                    <tr className="h-12 border-b border-borda text-[14px] font-bold">
                      <th className="px-3 py-3">Nome</th>
                      <th className="px-3 py-3">Escola</th>
                      <th className="px-3 py-3">Data</th>
                      <th className="px-3 py-3">Perfil dominante</th>
                      <th className="px-3 py-3">1.ª sugestão</th>
                      <th className="px-3 py-3">Curso escolhido</th>
                      <th className="px-3 py-3">Estado</th>
                      <th className="w-10 px-3 py-3"><span className="sr-only">Abrir</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borda text-[15px]">
                    {visiveis.map((a) => (
                      <tr key={a.id} onClick={() => navegar(`/orientador/alunos/${a.id}`)}
                        className="group h-14 cursor-pointer transition-colors hover:bg-primaria-clara/70">
                        <td className="whitespace-nowrap px-3 py-3.5 font-medium">
                          <Link to={`/orientador/alunos/${a.id}`} onClick={(e) => e.stopPropagation()} className="hover:text-primaria">
                            {nomeAbreviado(a.nome)}
                          </Link>
                        </td>
                        <td className="px-3 py-3.5 font-medium text-texto-suave">{a.escola}</td>
                        <td className="whitespace-nowrap px-3 py-3.5 font-medium tabular-nums text-texto-suave">{dataCurta(a.criado_em)}</td>
                        <td className="whitespace-nowrap px-3 py-3.5"><EtiquetaPerfil perfil={a.perfil_dominante} /></td>
                        <td className="px-3 py-3.5 font-medium">{curso(a.primeira_sugestao) ?? <span className="text-texto-suave">—</span>}</td>
                        <td className="px-3 py-3.5"><CursoEscolhido aluno={a} /></td>
                        <td className="px-3 py-3.5"><EtiquetaEstado estado={a.estado} quadrada quebra /></td>
                        <td className="px-3 py-3.5 text-right">
                          <ChevronRight className="ml-auto h-5 w-5 text-texto-suave transition-colors group-hover:text-primaria" aria-hidden="true" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Telemóvel e tablet: lista */}
              <ul className="divide-y divide-borda min-[1400px]:hidden">
                {visiveis.map((a) => (
                  <li key={a.id}>
                    <Link to={`/orientador/alunos/${a.id}`} className="flex items-center gap-3 px-4 py-4 hover:bg-primaria-clara/50 sm:px-5">
                      <span className="flex min-w-0 flex-1 flex-col gap-2">
                        <span className="flex flex-wrap items-start justify-between gap-2">
                          <span className="min-w-0">
                            <span className="block font-semibold">{nomeAbreviado(a.nome)}</span>
                            <span className="text-[13px] text-texto-suave">{a.escola} · {dataCurta(a.criado_em)}</span>
                          </span>
                          <EtiquetaEstado estado={a.estado} quadrada />
                        </span>
                        <span className="flex flex-wrap items-center gap-2 text-[14px]">
                          <EtiquetaPerfil perfil={a.perfil_dominante} />
                          {a.primeira_sugestao && <span className="text-texto-suave">1.ª: {curso(a.primeira_sugestao)}</span>}
                        </span>
                        {a.primeira_sugestao && (
                          <span className="text-[14px]">
                            <span className="text-texto-suave">Escolhido: </span><CursoEscolhido aluno={a} />
                          </span>
                        )}
                      </span>
                      <ChevronRight className="h-5 w-5 shrink-0 text-texto-suave" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {filtrados.length > 0 && (
            <div className="flex flex-col items-center justify-between gap-3 border-t border-borda px-4 py-4 sm:flex-row sm:px-6">
              <p className="text-[14px] text-texto-suave">
                A mostrar {inicio + 1}–{Math.min(inicio + POR_PAGINA, filtrados.length)} de {filtrados.length}
              </p>
              <Paginas pagina={paginaActual} total={totalPaginas} aoMudar={(n) => mudar("pagina", String(n))} />
            </div>
          )}
        </Cartao>
      )}
    </main>
  );
}
