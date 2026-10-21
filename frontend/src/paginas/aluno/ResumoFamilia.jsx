// Resumo para a família: folha A4 para imprimir ou guardar em PDF, inspirada
// no design Stitch "Resumo para impressão e família". Só mostra dados que o
// sistema tem (notas, notas mínimas dos cursos, sugestões); não tem códigos de
// validação nem selos oficiais, porque o documento não é oficial.

import { ArrowLeft, Check, Printer, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";

import { listarNotas, obterAluno } from "../../api/aluno";
import { IconeCurso } from "../../componentes/cursoVisual";
import { Compatibilidade, percentagem } from "../../componentes/sugestoes";
import { useRecomendacoes } from "../../hooks/useRecomendacoes";
import { sessaoAluno } from "../../sessao/sessaoAluno";

const hoje = () => new Date().toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });

function juntar(lista) {
  if (lista.length <= 1) return lista.join("");
  return `${lista.slice(0, -1).join(", ")} e ${lista[lista.length - 1]}`;
}

function situacao(nota, minimo) {
  if (minimo == null || nota == null) return { texto: "—", classe: "text-texto-suave" };
  const diff = nota - minimo;
  if (diff >= 2) return { texto: `Superado (+${diff})`, classe: "bg-emerald-50 text-emerald-800 print:bg-transparent" };
  if (diff >= 0) return { texto: "Cumpre", classe: "bg-primaria-clara text-primaria-escura print:bg-transparent" };
  return { texto: `Falta ${-diff}`, classe: "bg-amber-50 text-amber-800 print:bg-transparent" };
}

export default function ResumoFamilia() {
  const { alunoId, nome } = sessaoAluno();
  const { recomendacoes, escolhida, carregando, erro } = useRecomendacoes(alunoId);
  const [aluno, setAluno] = useState(null);
  const [notas, setNotas] = useState({});

  useEffect(() => {
    let activo = true;
    obterAluno(alunoId).then((a) => activo && setAluno(a)).catch(() => {});
    listarNotas()
      .then((lista) => activo && setNotas(Object.fromEntries(lista.map((n) => [n.disciplina, n.nota]))))
      .catch(() => {});
    return () => { activo = false; };
  }, [alunoId]);

  if (!carregando && !erro && !recomendacoes.length) return <Navigate to="/aluno/resultado" replace />;
  if (carregando) {
    return <div className="mx-auto mt-16 h-[600px] max-w-[820px] animate-pulse rounded-[16px] bg-borda/60" aria-label="A carregar" />;
  }
  if (erro && !recomendacoes.length) {
    return <p role="alert" className="mx-auto mt-16 max-w-[560px] rounded-lg bg-red-50 px-4 py-3 text-red-700">{erro.message}</p>;
  }

  const principal = escolhida ?? recomendacoes[0];
  const outras = recomendacoes.filter((r) => r.id !== principal.id);

  // Linhas da tabela: disciplinas com nota mínima em algum dos cursos sugeridos.
  const disciplinas = [...new Set(recomendacoes.flatMap((r) => (r.notas_minimas ?? []).map((m) => m.disciplina)))];
  const minimo = (rec, d) => (rec.notas_minimas ?? []).find((m) => m.disciplina === d)?.nota_min;
  const notaDe = (d) =>
    notas[d] ?? recomendacoes.flatMap((r) => r.notas_minimas ?? []).find((m) => m.disciplina === d)?.tua_nota;

  const chave = (principal.disciplinas_chave ?? []).slice(0, 3).map((d) => d.disciplina);
  const minimosPrincipal = (principal.notas_minimas ?? []).filter((m) => m.tua_nota != null);
  const topoPerfil = principal.perfil_aluno?.arquetipos?.[0];
  const lista = [
    ["Diálogo em casa", "Conversar em família sobre esta escolha e sobre as outras opções."],
    ["Informação", `Informar-se sobre as datas de inscrição no ${principal.curso_instituicao}.`],
    ["Documentos", `Confirmar no ${principal.curso_instituicao} que documentos são pedidos na inscrição e prepará-los com tempo.`],
    ["Notas", chave.length ? `Ajudar o aluno a manter as notas de ${juntar(chave)}.` : "Ajudar o aluno a manter as notas até ao fim do ano."],
  ];

  async function partilhar() {
    const texto =
      `Njango Edu — resumo de ${aluno?.nome ?? nome}\n` +
      `${escolhida ? "Curso escolhido" : "1.ª sugestão"}: ${principal.curso_nome} (${principal.curso_instituicao})\n` +
      (outras.length ? `Outras sugestões: ${outras.map((r) => `${r.curso_nome} (${r.curso_instituicao})`).join("; ")}` : "");
    try {
      await navigator.share({ title: "Resumo Njango Edu", text: texto });
    } catch {
      /* o aluno cancelou a partilha */
    }
  }

  return (
    <div className="min-h-screen bg-fundo print:bg-white">
      {/* Barra do ecrã (não sai na impressão) */}
      <div className="border-b border-borda bg-white print:hidden">
        <div className="mx-auto flex max-w-[860px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link to={escolhida ? "/aluno/curso-escolhido" : "/aluno/resultado"} className="flex items-center gap-2 text-[15px] font-semibold text-primaria">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <span className="hidden text-[13px] text-texto-suave md:inline">Folha A4 · a cores ou a preto e branco</span>
            {typeof navigator !== "undefined" && navigator.share && (
              <button type="button" onClick={partilhar} className="flex h-11 items-center gap-2 rounded-[10px] border-[1.5px] border-borda bg-white px-4 text-[14px] font-semibold text-texto hover:bg-fundo">
                <Share2 className="h-4 w-4" aria-hidden="true" /> Partilhar
              </button>
            )}
            <button type="button" onClick={() => window.print()} className="flex h-11 items-center gap-2 rounded-[10px] bg-primaria px-5 text-[14px] font-semibold text-white hover:bg-primaria-escura">
              <Printer className="h-4 w-4" aria-hidden="true" /> Imprimir ou guardar em PDF
            </button>
          </div>
        </div>
      </div>

      {/* A folha */}
      <main className="mx-auto max-w-[860px] px-4 py-8 sm:px-6 print:max-w-none print:p-0">
        <article className="folha-a4 rounded-[12px] border-t-[6px] border-primaria bg-white p-6 shadow-[0_12px_32px_rgba(37,43,66,0.08)] sm:p-10 print:rounded-none print:border-t-4 print:p-0 print:shadow-none">
          {/* Cabeçalho */}
          <header className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start print:mb-3 print:flex-row">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-primaria text-[18px] font-extrabold text-white print:h-9 print:w-9 print:text-[15px]">N</span>
              <div>
                <p className="text-[22px] font-extrabold leading-tight print:text-[18px]">
                  Njango<span className="text-primaria">Edu</span>
                  <span className="ml-2 align-middle text-[11px] font-bold uppercase tracking-wide text-primaria-escura">Resumo para a família</span>
                </p>
                <p className="text-[13px] text-texto-suave print:text-[10px]">
                  Orientação vocacional para finalistas do I Ciclo do Ensino Secundário · Luanda
                </p>
              </div>
            </div>
            <p className="rounded-[8px] bg-fundo px-3 py-2 text-[13px] print:bg-transparent print:p-0 print:text-[10px]">
              <span className="text-texto-suave">Data: </span><strong>{hoje()}</strong>
            </p>
          </header>

          {/* Aluno */}
          <section className="mb-6 grid gap-4 rounded-[10px] bg-primaria-clara/60 p-4 sm:grid-cols-3 print:mb-3 print:grid-cols-3 print:border print:border-borda print:bg-transparent print:p-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-texto-suave">Aluno</p>
              <p className="text-[16px] font-bold print:text-[13px]">{aluno?.nome ?? nome}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-texto-suave">Escola</p>
              <p className="text-[15px] print:text-[12px]">{aluno?.escola ?? "—"}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-texto-suave">Classe</p>
              <p className="text-[15px] print:text-[12px]">9.ª classe{aluno?.idade ? ` · ${aluno.idade} anos` : ""}</p>
            </div>
          </section>

          {/* Curso principal: cabeçalho e os 3 pontos da sugestão, em blocos */}
          <section className="mb-6 rounded-[12px] border-[1.5px] border-borda print:mb-3">
            <div className="flex items-center gap-4 border-b border-borda p-5 print:gap-3 print:p-3">
              <IconeCurso nome={principal.curso_nome} className="h-14 w-14 shrink-0 print:h-10 print:w-10" />
              <div className="min-w-0 flex-1">
                <p className="mb-1 inline-block rounded-full bg-primaria px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white print:border print:border-texto print:bg-transparent print:px-2 print:text-[8px] print:text-texto">
                  {escolhida ? "Curso escolhido" : "1.ª sugestão"}
                </p>
                <h1 className="text-[22px] font-bold leading-tight print:text-[15px]">{principal.curso_nome}</h1>
                <p className="text-[14px] font-semibold text-primaria print:text-[10px] print:text-texto">{principal.curso_instituicao}</p>
                {principal.curso_descricao && (
                  <p className="mt-1 text-[13px] leading-snug text-texto-suave print:text-[9px]">{principal.curso_descricao}</p>
                )}
              </div>
              <Compatibilidade rec={principal} tamanho={84} className="shrink-0" />
            </div>

            <div className="p-5 print:p-3">
              <h2 className="mb-3 text-[13px] font-bold uppercase tracking-wide text-texto-suave print:mb-2 print:text-[9px]">Porque foi sugerido</h2>
              <ol className="grid gap-3 sm:grid-cols-3 print:grid-cols-3 print:gap-2">
                <li className="rounded-[10px] bg-fundo p-3 print:border print:border-borda print:bg-transparent print:p-2">
                  <p className="mb-1.5 text-[12px] font-bold text-primaria-escura print:text-[9px]">1. Notas mínimas</p>
                  {minimosPrincipal.length ? (
                    <>
                      <p className="mb-1.5 flex items-center gap-1 text-[14px] font-bold text-emerald-700 print:text-[10.5px]">
                        <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /> Cumpre todas
                      </p>
                      <ul className="text-[12px] leading-snug text-texto-suave print:text-[9px]">
                        {minimosPrincipal.map((m) => (
                          <li key={m.disciplina}>{m.disciplina}: <strong className="text-texto">{m.tua_nota}</strong> (mín. {m.nota_min})</li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <p className="text-[12px] text-texto-suave print:text-[9px]">O curso não pede notas mínimas específicas.</p>
                  )}
                </li>
                <li className="rounded-[10px] bg-fundo p-3 print:border print:border-borda print:bg-transparent print:p-2">
                  <p className="mb-1 text-[12px] font-bold text-primaria-escura print:text-[9px]">2. Notas parecidas com as ideais</p>
                  <p className="text-[26px] font-bold leading-tight tabular-nums text-primaria-escura print:text-[17px]">{percentagem(principal.score_academico)}%</p>
                  <p className="text-[12px] leading-snug text-texto-suave print:text-[9px]">
                    As 12 notas do aluno comparadas com as notas ideais do curso.
                  </p>
                </li>
                <li className="rounded-[10px] bg-fundo p-3 print:border print:border-borda print:bg-transparent print:p-2">
                  <p className="mb-1 text-[12px] font-bold text-primaria-escura print:text-[9px]">3. Respostas ao teste</p>
                  <p className="text-[26px] font-bold leading-tight tabular-nums text-primaria-escura print:text-[17px]">{percentagem(principal.score_psicografico)}%</p>
                  <p className="text-[12px] leading-snug text-texto-suave print:text-[9px]">
                    das respostas no perfil {principal.curso_arquetipo}, o perfil do curso.
                    {topoPerfil && topoPerfil.arquetipo !== principal.curso_arquetipo && ` Perfil mais forte: ${topoPerfil.arquetipo}.`}
                  </p>
                </li>
              </ol>
              <p className="mt-3 rounded-[8px] bg-primaria-clara/60 px-3 py-2 text-center text-[13px] font-semibold text-primaria-escura print:mt-2 print:bg-transparent print:p-0 print:text-[9.5px]">
                Notas {percentagem(principal.score_academico)}% × 60% + Teste {percentagem(principal.score_psicografico)}% × 40% ≈{" "}
                {percentagem(principal.score_final)}% de compatibilidade
              </p>
            </div>
          </section>

          {/* Tabela */}
          {disciplinas.length > 0 && (
            <section className="mb-6 print:mb-3">
              <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
                <h2 className="text-[17px] font-bold print:text-[13px]">Notas do aluno e notas mínimas dos cursos sugeridos</h2>
                <span className="text-[12px] text-texto-suave print:text-[9px]">Escala de 0 a 20 valores</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse text-left text-[13px] print:min-w-0 print:text-[10px]">
                  <thead>
                    <tr className="bg-primaria-clara/70 print:bg-transparent">
                      <th scope="col" className="border-b border-borda px-3 py-2 font-semibold print:px-2 print:py-0.5">Disciplina</th>
                      <th scope="col" className="border-b border-borda bg-primaria-clara px-3 py-2 text-center font-semibold print:bg-transparent print:px-2 print:py-0.5">Nota do aluno</th>
                      {recomendacoes.map((r) => (
                        <th key={r.id} scope="col" className="border-b border-borda px-3 py-2 text-center font-semibold leading-tight print:px-2 print:py-0.5">
                          Mín. {r.curso_instituicao}
                          <span className="block text-[11px] font-normal text-texto-suave print:text-[8px]">{r.curso_nome.replace(/^Técnico de /, "")} · {percentagem(r.score_final)}%</span>
                        </th>
                      ))}
                      <th scope="col" className="border-b border-borda px-3 py-2 text-center font-semibold print:px-2 print:py-0.5">
                        Situação<span className="block text-[11px] font-normal text-texto-suave print:text-[8px]">no {escolhida ? "curso escolhido" : "1.º curso"}</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {disciplinas.map((d) => {
                      const nota = notaDe(d);
                      const s = situacao(nota, minimo(principal, d));
                      return (
                        <tr key={d} className="border-b border-borda/70">
                          <td className="px-3 py-2 font-medium print:px-2 print:py-0.5">{d}</td>
                          <td className="bg-primaria-clara/50 px-3 py-2 text-center text-[15px] font-bold text-primaria-escura print:bg-transparent print:px-2 print:py-0.5 print:text-[11px] print:text-texto">{nota ?? "—"}</td>
                          {recomendacoes.map((r) => (
                            <td key={r.id} className="px-3 py-2 text-center text-texto-suave print:px-2 print:py-0.5">{minimo(r, d) ?? "—"}</td>
                          ))}
                          <td className="px-3 py-2 text-center print:px-2 print:py-0.5">
                            <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-semibold print:p-0 print:text-[10px] ${s.classe}`}>{s.texto}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Outras opções */}
          {outras.length > 0 && (
            <section className="mb-6 print:mb-3">
              <h2 className="mb-1 text-[17px] font-bold print:text-[13px]">Outras opções sugeridas</h2>
              <p className="mb-3 text-[13px] text-texto-suave print:mb-2 print:text-[10px]">Também cumprem as notas mínimas e podem servir de alternativa.</p>
              <div className="grid gap-3 sm:grid-cols-2 print:grid-cols-2">
                {outras.map((r) => (
                  <div key={r.id} className="rounded-[10px] bg-fundo p-4 print:border print:border-borda print:bg-transparent print:p-2.5">
                    <p className="mb-1 flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wide text-primaria-escura print:text-texto-suave">
                      {r.rank}.ª sugestão
                      <span className="rounded-full bg-primaria-clara px-2 py-0.5 text-[12px] normal-case tracking-normal text-primaria-escura print:bg-transparent print:p-0 print:text-[10px]">
                        {percentagem(r.score_final)}% compatível
                      </span>
                    </p>
                    <p className="text-[16px] font-bold leading-snug print:text-[12px]">{r.curso_nome}</p>
                    <p className="mb-1.5 text-[13px] font-semibold text-primaria print:text-[10px] print:text-texto">{r.curso_instituicao}</p>
                    <p className="text-[12px] text-texto-suave print:text-[9px]">
                      Notas <strong className="text-texto">{percentagem(r.score_academico)}%</strong> · Teste{" "}
                      <strong className="text-texto">{percentagem(r.score_psicografico)}%</strong> · Perfil {r.curso_arquetipo}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Lista para a família */}
          <section className="mb-8 rounded-[10px] bg-fundo p-5 print:mb-3 print:border print:border-borda print:bg-transparent print:p-3">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[17px] font-bold print:text-[13px]">O que a família pode fazer agora</h2>
              <span className="text-[12px] text-texto-suave print:text-[9px]">Marcar com caneta</span>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 print:grid-cols-2 print:gap-2">
              {lista.map(([titulo, texto], i) => (
                <li key={titulo} className="flex gap-3 rounded-[8px] bg-white p-3 print:gap-2 print:p-1">
                  <span className="mt-0.5 h-5 w-5 shrink-0 rounded-[4px] border-2 border-texto-suave print:h-4 print:w-4" aria-hidden="true" />
                  <span>
                    <span className="block text-[11px] font-bold uppercase tracking-wide text-primaria-escura print:text-[8px] print:text-texto-suave">
                      Passo {i + 1} · {titulo}
                    </span>
                    <span className="block text-[13px] leading-snug print:text-[10px] print:leading-tight">{texto}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Assinaturas */}
          <section className="mb-6 grid grid-cols-2 gap-8 pt-6 print:mb-2 print:pt-5">
            {["Assinatura do encarregado de educação", "Assinatura do aluno"].map((t) => (
              <div key={t} className="border-t border-texto/60 pt-2 text-center text-[12px] text-texto-suave print:text-[10px]">{t}</div>
            ))}
          </section>

          <footer className="border-t border-borda pt-3 text-[11px] leading-relaxed text-texto-suave print:text-[8.5px]">
            Este resumo foi produzido pelo Njango Edu, um sistema de apoio à orientação vocacional, a partir das notas
            indicadas pelo aluno e das respostas ao teste. É uma ajuda à decisão da família e não substitui a inscrição
            oficial nem as regras de acesso de cada instituição. A compatibilidade junta as notas (60%) e as respostas ao
            teste (40%).
          </footer>
        </article>
      </main>
    </div>
  );
}
