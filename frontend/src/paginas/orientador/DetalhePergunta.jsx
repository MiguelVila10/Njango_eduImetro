// Detalhe de uma pergunta do teste (design "Njango Edu — Detalhe da
// pergunta"): as 4 opções com o perfil e quantas vezes cada uma foi
// escolhida, e uma pré-visualização de como o aluno a vê (sem perfis).
// RF12: pode editar e desactivar; não se apaga.

import { ArrowLeft, CircleCheck, Link2, LoaderCircle, Lock, Pencil, Power, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { alterarPergunta, listarPerguntas } from "../../api/orientador";
import FormularioPergunta from "../../componentes/orientador/FormularioPergunta";
import { COR_PERFIL, Cartao, ORDEM_PERFIS } from "../../componentes/orientador/pecas";
import { useCarregar } from "../../hooks/useCarregar";

const LETRAS = "ABCD";
const NOME_TIPO = { nucleo: "Principal", verificacao: "Verificação" };
const pct = (v, t) => (t ? Math.round((v / t) * 100) : 0);

function Letra({ children }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eef0f4] text-[12px] font-bold text-texto-suave">{children}</span>
  );
}

export default function DetalhePergunta() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { key } = useLocation();
  const { dados, erro, carregando, recarregar } = useCarregar(listarPerguntas);
  const [editar, setEditar] = useState(false);
  const [aviso, setAviso] = useState(null);
  const [aMudar, setAMudar] = useState(false);
  const [erroAccao, setErroAccao] = useState(null);

  const numeradas = useMemo(() => {
    const ordenadas = [...(dados ?? [])].sort((a, b) => (a.posicao ?? 999) - (b.posicao ?? 999) || a.id - b.id);
    return ordenadas.map((q, i) => ({ ...q, numero: i + 1 }));
  }, [dados]);
  const p = numeradas.find((q) => String(q.id) === String(id));
  const numeroPar = p?.par ? numeradas.find((q) => q.id === p.par.id)?.numero : null;

  function voltar(e) {
    if (key !== "default") { e.preventDefault(); navegar(-1); }
  }

  async function activar() {
    setAMudar(true); setErroAccao(null);
    try {
      await alterarPergunta(p.id, { ativo: !p.ativo });
      setAviso(p.ativo ? "Pergunta desactivada: deixa de aparecer no teste. As respostas ficam guardadas." : "Pergunta activada: volta a poder aparecer no teste.");
      await recarregar();
    } catch (e) {
      setErroAccao(e.message);
    } finally {
      setAMudar(false);
    }
  }

  const total = p?.total_respostas ?? 0;

  return (
    <main className="mx-auto w-full max-w-[1160px] px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <Link to="/orientador/perguntas" onClick={voltar} className="mb-6 inline-flex items-center gap-2 text-[15px] font-medium text-primaria hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar às perguntas do teste
      </Link>

      {carregando && !dados && <div className="h-[520px] animate-pulse rounded-[12px] bg-borda/60" aria-label="A carregar a pergunta" />}
      {(erro || erroAccao) && (
        <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-red-50 px-5 py-4 text-[15px] text-red-700">
          <span>{erroAccao ?? `Não foi possível carregar a pergunta. ${erro.message}`}</span>
          {erro && <button type="button" onClick={recarregar} className="flex items-center gap-2 font-semibold underline"><RefreshCw className="h-4 w-4" aria-hidden="true" /> Tentar de novo</button>}
        </div>
      )}
      {dados && !p && <p className="rounded-[12px] bg-red-50 px-5 py-4 text-[15px] text-red-700">Esta pergunta não existe.</p>}

      {p && (
        <div className="flex flex-col gap-6">
          {aviso && (
            <p role="status" className="flex items-center gap-2 rounded-[12px] bg-emerald-50 px-5 py-4 text-[15px] font-medium text-emerald-800">
              <CircleCheck className="h-5 w-5 shrink-0" aria-hidden="true" /> {aviso}
            </p>
          )}

          <Cartao className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[18px] font-bold">Pergunta n.º {p.numero}</span>
                <span className={`rounded-[6px] border px-2.5 py-1 text-[13px] font-semibold ${p.tipo === "verificacao" ? "border-borda bg-[#eef0f4] text-texto-suave" : "border-primaria/25 bg-primaria-clara text-primaria-escura"}`}>
                  {NOME_TIPO[p.tipo] ?? p.tipo}
                </span>
                {!p.ativo && <span className="rounded-[6px] border border-dashed border-[#c5ccd8] px-2.5 py-1 text-[13px] font-semibold text-texto-suave">Desactivada</span>}
              </div>
              <span className="text-[15px] text-texto-suave">Respondida {total} {total === 1 ? "vez" : "vezes"}</span>
            </div>
            <h1 className="mt-4 text-[24px] font-bold leading-snug sm:text-[26px]">{p.texto}</h1>
            {p.par && (
              <p className="mt-3 flex items-center gap-2 text-[14px] text-texto-suave">
                <Link2 className="h-4 w-4 shrink-0 text-primaria" aria-hidden="true" />
                {p.tipo === "verificacao" ? "Confirma a" : "É confirmada pela"}{" "}
                <Link to={`/orientador/perguntas/${p.par.id}`} className="font-semibold text-primaria hover:underline">pergunta n.º {numeroPar}</Link>
              </p>
            )}
            <div className="mt-5 flex flex-col gap-3 border-t border-borda pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-[14px] text-texto-suave">
                <Lock className="h-4 w-4 shrink-0" aria-hidden="true" /> As perguntas não podem ser apagadas: para a tirar do teste, desactive-a.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={activar} disabled={aMudar}
                  className={`flex h-10 items-center justify-center gap-2 rounded-[8px] border-[1.5px] px-4 text-[14px] font-semibold ${p.ativo ? "border-borda text-texto hover:border-[#e0a100] hover:bg-[#fff8eb]" : "border-[#1e8e5a] text-[#1e7a4f] hover:bg-[#e7f4ec]"}`}>
                  {aMudar ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Power className="h-4 w-4" aria-hidden="true" />}
                  {p.ativo ? "Desactivar" : "Activar"}
                </button>
                <button type="button" onClick={() => { setAviso(null); setEditar(true); }}
                  className="flex h-10 items-center justify-center gap-2 rounded-[8px] border-[1.5px] border-primaria px-4 text-[14px] font-semibold text-primaria hover:bg-primaria-clara">
                  <Pencil className="h-4 w-4" aria-hidden="true" /> Editar pergunta
                </button>
              </div>
            </div>
          </Cartao>

          <div className="grid items-start gap-6 lg:grid-cols-[7fr_5fr]">
            <Cartao className="p-6">
              <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-[20px] font-semibold">Opções de resposta</h2>
                <span className="text-[14px] text-texto-suave">Total: {total} {total === 1 ? "resposta" : "respostas"}</span>
              </div>
              <ul className="flex flex-col gap-4">
                {ORDEM_PERFIS.map((perfil, i) => {
                  const opcao = p.opcoes.find((o) => o.arquetipo === perfil);
                  const cor = COR_PERFIL[perfil];
                  const vezes = p.respostas_por_arquetipo?.[perfil] ?? 0;
                  const certa = p.tendencia === perfil;
                  return (
                    <li key={perfil} className="rounded-[10px] border border-borda p-4" style={{ borderLeft: `4px solid ${cor}` }}>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                        <span className="flex items-start gap-3 text-[15px]">
                          <Letra>{LETRAS[i]}</Letra> <span className="pt-0.5">{opcao?.texto ?? "—"}</span>
                        </span>
                        <span className="flex shrink-0 flex-wrap items-center gap-1.5 pl-9 sm:flex-col sm:items-end sm:pl-0">
                          <span className="inline-flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1 text-[13px] font-semibold"
                            style={{ color: cor, borderColor: `${cor}40`, backgroundColor: `${cor}12` }}>
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cor }} aria-hidden="true" /> {perfil}
                          </span>
                          {certa && <span className="rounded-[6px] border border-[#fbd28a] bg-[#fff4e0] px-2 py-0.5 text-[12px] font-semibold text-[#9a5b00]">Conta menos</span>}
                        </span>
                      </div>
                      {certa && <p className="mt-2 pl-9 text-[13px] text-texto-suave">Marcada como a resposta que parece “certa” para a maioria.</p>}
                      <div className="mt-3 pl-9">
                        <div className="mb-1.5 flex justify-between text-[13px]">
                          <span className="font-semibold">{vezes} {vezes === 1 ? "vez" : "vezes"}</span>
                          <span className="text-texto-suave">{pct(vezes, total)}%</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-[#eef0f4]">
                          <div className="h-full rounded-full" style={{ width: `${pct(vezes, total)}%`, backgroundColor: cor }} />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Cartao>

            <Cartao className="p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[20px] font-semibold">Como o aluno vê</h2>
                <span className="rounded-[6px] border border-borda px-2 py-1 text-[12px] text-texto-suave">Pré-visualização</span>
              </div>
              <div className="rounded-[12px] border border-borda bg-[#fafbfc] p-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-texto-suave">Pergunta do teste</p>
                <p className="mt-2 text-[17px] font-bold leading-snug">{p.texto}</p>
                <ul className="mt-4 flex flex-col gap-2.5">
                  {ORDEM_PERFIS.map((perfil, i) => (
                    <li key={perfil} className="flex items-start gap-3 rounded-[10px] border border-borda bg-white px-4 py-3 text-[14px]">
                      <Letra>{LETRAS[i]}</Letra> <span className="pt-0.5">{p.opcoes.find((o) => o.arquetipo === perfil)?.texto}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="mt-4 text-[13px] leading-relaxed text-texto-suave">
                O aluno não vê o perfil de cada opção, e a ordem das opções muda de aluno para aluno, para não influenciar as respostas.
              </p>
            </Cartao>
          </div>
        </div>
      )}

      {p && (
        <FormularioPergunta aberto={editar} pergunta={p} principais={numeradas.filter((q) => q.tipo === "nucleo")}
          aoFechar={() => setEditar(false)}
          aoGuardar={() => { setEditar(false); setAviso("Pergunta actualizada."); recarregar(); }} />
      )}
    </main>
  );
}
