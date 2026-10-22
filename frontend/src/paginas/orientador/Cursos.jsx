// Catálogo de cursos do orientador (design "Njango Edu — Gestão de cursos"):
// pesquisa, filtros por escola e perfil, tabela com os pré-requisitos e o
// painel lateral "Adicionar curso". Clicar num curso abre o detalhe.

import { BookOpen, ChevronRight, CircleCheck, Plus, RefreshCw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { listarCursos } from "../../api/orientador";
import FormularioCurso, { ESCOLAS } from "../../componentes/orientador/FormularioCurso";
import { Cartao, EtiquetaPerfil, Filtro, ORDEM_PERFIS, Paginas, nomeCurtoCurso } from "../../componentes/orientador/pecas";
import { useCarregar } from "../../hooks/useCarregar";

const POR_PAGINA = 8;
const simplificar = (t = "") => t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
export const textoPreRequisitos = (lista = []) =>
  lista.length ? lista.map((p) => `${p.disciplina} ≥ ${p.nota_min}`).join(" · ") : "Sem pré-requisitos";

export default function Cursos() {
  const navegar = useNavigate();
  const { dados, erro, carregando, recarregar } = useCarregar(listarCursos);
  const [params, setParams] = useSearchParams();
  const [formulario, setFormulario] = useState(false);
  const [aviso, setAviso] = useState(null);
  const pesquisa = params.get("q") ?? "";
  const escola = params.get("escola") ?? "";
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
    return (dados ?? []).filter((c) =>
      (!q || simplificar(c.nome).includes(q) || simplificar(c.instituicao).includes(q))
      && (!escola || c.instituicao === escola)
      && (!perfil || c.arquetipo_dominante === perfil));
  }, [dados, pesquisa, escola, perfil]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const inicio = (paginaActual - 1) * POR_PAGINA;
  const visiveis = filtrados.slice(inicio, inicio + POR_PAGINA);

  function guardado(curso) {
    setFormulario(false);
    setAviso(curso);
    recarregar();
  }

  return (
    <main className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <header className="mb-6 flex flex-col gap-4 border-b border-borda pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold leading-tight tracking-tight lg:text-[32px]">Cursos</h1>
          <p className="mt-2 text-[15px] text-texto-suave">Catálogo dos cursos técnicos que o sistema pode sugerir aos alunos.</p>
        </div>
        <button type="button" onClick={() => setFormulario(true)}
          className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-[8px] bg-primaria px-5 text-[15px] font-semibold text-white hover:bg-primaria-escura">
          <Plus className="h-5 w-5" aria-hidden="true" /> Adicionar curso
        </button>
      </header>

      {aviso && (
        <div role="status" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-emerald-50 px-5 py-4 text-[15px] text-emerald-800">
          <span className="flex items-center gap-2 font-medium">
            <CircleCheck className="h-5 w-5" aria-hidden="true" /> Curso "{aviso.nome}" adicionado. Já pode ser sugerido aos alunos.
          </span>
          <Link to={`/orientador/cursos/${aviso.id}`} className="font-semibold underline">Ver o curso</Link>
        </div>
      )}

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
          <label className="relative sm:col-span-2 lg:w-[300px]">
            <span className="sr-only">Pesquisar curso</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-texto-suave" aria-hidden="true" />
            <input type="search" value={pesquisa} onChange={(e) => mudar("q", e.target.value)} placeholder="Pesquisar curso"
              className="h-12 w-full rounded-[12px] border border-borda bg-white pl-11 pr-4 text-[14px] placeholder:text-texto-suave shadow-xs focus:border-primaria focus:outline-none focus:ring-1 focus:ring-primaria" />
          </label>
          <Filtro rotulo="Escola" valor={escola} aoMudar={(v) => mudar("escola", v)} opcoes={ESCOLAS.map((e) => [e, e])} />
          <Filtro rotulo="Perfil" valor={perfil} aoMudar={(v) => mudar("perfil", v)} opcoes={ORDEM_PERFIS.map((p) => [p, p])} />
        </div>
        {dados && <p className="text-[15px] text-texto-suave" aria-live="polite">{filtrados.length} {filtrados.length === 1 ? "curso" : "cursos"}</p>}
      </div>

      {erro && (
        <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-red-50 px-5 py-4 text-[15px] text-red-700">
          <span>Não foi possível carregar os cursos. {erro.message}</span>
          <button type="button" onClick={recarregar} className="flex items-center gap-2 font-semibold underline">
            <RefreshCw className="h-4 w-4" aria-hidden="true" /> Tentar de novo
          </button>
        </div>
      )}
      {carregando && !dados && <div className="h-[460px] animate-pulse rounded-[12px] bg-borda/60" aria-label="A carregar os cursos" />}

      {dados && (
        <Cartao className="overflow-hidden">
          {visiveis.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <BookOpen className="mb-3 h-10 w-10 text-texto-suave" aria-hidden="true" />
              <p className="text-[17px] font-bold">{dados.length ? "Nenhum curso com estes filtros" : "Ainda não há cursos no catálogo"}</p>
              {dados.length > 0 && (
                <button type="button" onClick={() => setParams({}, { replace: true })} className="mt-3 text-[15px] font-semibold text-primaria hover:underline">
                  Limpar a pesquisa e os filtros
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="hidden lg:block">
                <table className="w-full text-left">
                  <thead>
                    <tr className="h-12 border-b border-borda text-[14px] font-bold">
                      <th className="px-5 py-3">Curso</th>
                      <th className="px-4 py-3">Escola</th>
                      <th className="px-4 py-3">Perfil dominante</th>
                      <th className="px-4 py-3">Pré-requisitos</th>
                      <th className="w-10 px-3 py-3"><span className="sr-only">Abrir</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borda text-[15px]">
                    {visiveis.map((c) => (
                      <tr key={c.id} onClick={() => navegar(`/orientador/cursos/${c.id}`)} className="group h-14 cursor-pointer hover:bg-primaria-clara/70">
                        <td className="px-5 py-3.5 font-medium">
                          <Link to={`/orientador/cursos/${c.id}`} onClick={(e) => e.stopPropagation()} className="hover:text-primaria">{nomeCurtoCurso(c.nome)}</Link>
                        </td>
                        <td className="px-4 py-3.5 font-medium text-texto-suave">{c.instituicao}</td>
                        <td className="whitespace-nowrap px-4 py-3.5"><EtiquetaPerfil perfil={c.arquetipo_dominante} /></td>
                        <td className="px-4 py-3.5 text-[14px] text-texto-suave">{textoPreRequisitos(c.prerequisitos)}</td>
                        <td className="px-3 py-3.5"><ChevronRight className="ml-auto h-5 w-5 text-texto-suave group-hover:text-primaria" aria-hidden="true" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="divide-y divide-borda lg:hidden">
                {visiveis.map((c) => (
                  <li key={c.id}>
                    <Link to={`/orientador/cursos/${c.id}`} className="flex items-center gap-3 px-4 py-4 hover:bg-primaria-clara/50 sm:px-5">
                      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{nomeCurtoCurso(c.nome)}</span>
                          <span className="text-[14px] text-texto-suave">{c.instituicao}</span>
                        </span>
                        <span><EtiquetaPerfil perfil={c.arquetipo_dominante} /></span>
                        <span className="text-[13px] text-texto-suave">{textoPreRequisitos(c.prerequisitos)}</span>
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
              <p className="text-[14px] text-texto-suave">A mostrar {inicio + 1}–{Math.min(inicio + POR_PAGINA, filtrados.length)} de {filtrados.length}</p>
              <Paginas pagina={paginaActual} total={totalPaginas} aoMudar={(n) => mudar("pagina", String(n))} />
            </div>
          )}
        </Cartao>
      )}

      <FormularioCurso aberto={formulario} aoFechar={() => setFormulario(false)} aoGuardar={guardado} />
    </main>
  );
}
