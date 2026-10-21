// Detalhe de um curso sugerido. Aqui fica a explicação completa, em 3 passos
// visuais (os mesmos do motor), com pouco texto:
//   1. Notas mínimas (filtro SE-ENTÃO): cada exigência com a nota do aluno.
//   2. Notas vs notas ideais (similaridade): barras das disciplinas que contam.
//   3. Teste (perfil): como as respostas se repartem e qual é o perfil do curso.
// Depois, a soma dos dois em blocos (60% notas + 40% teste = compatibilidade).

import { Check, CircleAlert, Equal, Info, Lightbulb, Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";

import CabecalhoPercurso from "../../componentes/CabecalhoPercurso";
import { IlustracaoCurso } from "../../componentes/cursoVisual";
import {
  PERFIS, leituraNotasIdeais, leituraNotasMinimas, leituraSoma, leituraTeste,
} from "../../componentes/explicacao";
import {
  AvisoVinteQuatroHoras, BOTAO_PRINCIPAL, BOTAO_SECUNDARIO, Compatibilidade, ConfirmarEscolha, percentagem,
  proximosPassos,
} from "../../componentes/sugestoes";
import { useRecomendacoes } from "../../hooks/useRecomendacoes";
import { sessaoAluno } from "../../sessao/sessaoAluno";

function OQueQuerDizer({ children }) {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-[12px] bg-amber-50/70 px-4 py-3 ring-1 ring-amber-100">
      <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
      <p className="text-[14px] leading-relaxed text-texto md:text-[15px]">
        <strong className="font-semibold">O que isto quer dizer: </strong>
        {children}
      </p>
    </div>
  );
}

function Passo({ numero, titulo, resumo, leitura, children }) {
  return (
    <li className="relative flex gap-4 md:gap-6">
      <div className="flex flex-col items-center">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primaria text-[16px] font-bold text-white">
          {numero}
        </span>
        <span className="mt-2 w-px flex-1 bg-borda" aria-hidden="true" />
      </div>
      <div className="mb-6 min-w-0 flex-1 rounded-[16px] border-[1.5px] border-borda bg-white p-5 md:p-6">
        <h3 className="text-[17px] font-bold md:text-[18px]">{titulo}</h3>
        <p className="mb-4 mt-1 text-[14px] text-texto-suave md:text-[15px]">{resumo}</p>
        {children}
        {leitura && <OQueQuerDizer>{leitura}</OQueQuerDizer>}
      </div>
    </li>
  );
}

function Estado({ ok, texto }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
        ok ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
      }`}
    >
      {ok ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" /> : <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />}
      {texto}
    </span>
  );
}

function BlocoFormula({ rotulo, valor, peso }) {
  return (
    <div className="flex flex-1 flex-col items-center rounded-[14px] bg-fundo px-4 py-4 text-center ring-1 ring-borda">
      <span className="text-[13px] font-semibold text-texto-suave">{rotulo}</span>
      <span className="text-[28px] font-bold leading-tight tabular-nums text-primaria-escura">{valor}%</span>
      <span className="text-[12px] font-medium text-texto-suave">vale {peso}</span>
    </div>
  );
}

export default function DetalheCurso() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { alunoId } = sessaoAluno();
  const { recomendacoes, escolhida, carregando, aEscolher, erro, escolher } = useRecomendacoes(alunoId);
  const [aConfirmar, setAConfirmar] = useState(null);
  const fecharConfirmacao = useCallback(() => setAConfirmar(null), []);

  const rec = recomendacoes.find((r) => String(r.id) === String(id));
  if (!carregando && !rec) return <Navigate to="/aluno/resultado" replace />;

  async function confirmar() {
    if (await escolher(aConfirmar.id)) navegar("/aluno/curso-escolhido");
  }

  let conteudo;
  if (carregando) {
    conteudo = <div className="mx-auto h-[520px] w-full max-w-[880px] animate-pulse rounded-[16px] bg-borda/60" aria-label="A carregar" />;
  } else {
    const eEscolhido = rec.escolhida_pelo_aluno;
    const minimos = rec.notas_minimas ?? [];
    const chave = rec.disciplinas_chave ?? [];
    const perfil = rec.perfil_aluno;
    const doCurso = perfil?.arquetipos?.find((a) => a.arquetipo === rec.curso_arquetipo);
    const primeira = recomendacoes.find((r) => r.rank === 1);

    conteudo = (
      <div className="mx-auto w-full max-w-[880px]">
        {/* Cabeçalho com imagem do curso */}
        <section className="mb-10 grid overflow-hidden rounded-[20px] bg-primaria-clara md:grid-cols-[1fr_300px]">
          <div className="order-2 px-6 py-7 md:order-1 md:px-10 md:py-10">
            <div className="mb-4 flex flex-wrap gap-2">
              {eEscolhido && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[13px] font-semibold text-emerald-700">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" /> A tua escolha
                </span>
              )}
              <span className="rounded-full bg-primaria px-3 py-1 text-[13px] font-semibold text-white">{rec.rank}.ª sugestão</span>
              <span className="rounded-full bg-white px-3 py-1 text-[13px] font-semibold text-primaria-escura ring-1 ring-borda">
                Perfil {rec.curso_arquetipo}
              </span>
            </div>
            <h1 className="mb-2 text-[30px] font-bold leading-tight md:text-[38px]">{rec.curso_nome}</h1>
            <p className="mb-4 text-[17px] text-texto-suave">{rec.curso_instituicao}</p>
            <p className="max-w-[46ch] text-[15px] leading-relaxed text-texto-suave">
              {rec.curso_descricao || `Para saberes o que se aprende neste curso, informa-te junto do ${rec.curso_instituicao}.`}
            </p>
          </div>
          <IlustracaoCurso nome={rec.curso_nome} className="order-1 h-[170px] rounded-none md:order-2 md:h-full md:min-h-[260px]" />
        </section>

        {/* Porque te sugerimos: 3 passos */}
        <section aria-labelledby="porque-titulo">
          <h2 id="porque-titulo" className="mb-1 text-[22px] font-bold md:text-[26px]">Porque te sugerimos este curso</h2>
          <p className="mb-6 text-[15px] text-texto-suave">O Njango Edu olhou para ti em três passos.</p>

          <ol>
            <Passo
              numero={1}
              titulo="Tens as notas mínimas"
              leitura={leituraNotasMinimas(rec)}
              resumo={minimos.length ? "O curso pede uma nota mínima nestas disciplinas. Tu cumpres todas." : "Este curso não pede nota mínima em disciplinas específicas."}
            >
              {minimos.length > 0 && (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {minimos.map((m) => {
                    const margem = (m.tua_nota ?? 0) - m.nota_min;
                    return (
                      <li key={m.disciplina} className="flex items-center justify-between gap-3 rounded-[12px] bg-fundo px-4 py-3 ring-1 ring-borda">
                        <span className="min-w-0">
                          <span className="block text-[14px] font-semibold">{m.disciplina}</span>
                          <span className="text-[13px] text-texto-suave">
                            tens <strong className="text-[16px] text-texto">{m.tua_nota}</strong> · pede {m.nota_min}
                          </span>
                        </span>
                        <Estado ok texto={margem > 0 ? `+${margem}` : "Cumpre"} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </Passo>

            <Passo
              numero={2}
              titulo="As tuas notas parecem-se com as ideais"
              leitura={leituraNotasIdeais(rec)}
              resumo={`Comparámos as tuas 12 notas com as notas ideais do curso: são ${percentagem(rec.score_academico)}% parecidas.`}
            >
              <div className="mb-3 flex flex-wrap gap-4 text-[12px] text-texto-suave">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-primaria" aria-hidden="true" /> A tua nota</span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[3px] bg-[#cfd5df]" aria-hidden="true" /> Ideal para o curso</span>
              </div>
              <ul className="flex flex-col gap-3">
                {chave.map((d) => {
                  const ok = d.tua_nota != null && d.tua_nota >= d.referencia;
                  return (
                    <li key={d.disciplina} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 sm:grid-cols-[150px_1fr_auto]">
                      <span className="text-[14px] font-semibold">{d.disciplina}</span>
                      <span className="col-span-2 row-start-2 flex flex-col gap-1 sm:col-span-1 sm:row-start-auto">
                        <span className="h-2.5 overflow-hidden rounded-full bg-fundo ring-1 ring-borda/70">
                          <span className="block h-full rounded-full bg-primaria" style={{ width: `${((d.tua_nota ?? 0) / 20) * 100}%` }} />
                        </span>
                        <span className="h-2.5 overflow-hidden rounded-full bg-fundo ring-1 ring-borda/70">
                          <span className="block h-full rounded-full bg-[#cfd5df]" style={{ width: `${(d.referencia / 20) * 100}%` }} />
                        </span>
                      </span>
                      <span className="flex items-center gap-2 justify-self-end">
                        <span className="text-[13px] tabular-nums text-texto-suave"><strong className="text-texto">{d.tua_nota ?? "—"}</strong>/{d.referencia}</span>
                        <Estado ok={ok} texto={ok ? "No nível" : "Podes melhorar"} />
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Passo>

            <Passo
              numero={3}
              titulo="Combina com as tuas respostas"
              leitura={leituraTeste(rec)}
              resumo={
                doCurso
                  ? `${doCurso.respostas} de ${perfil.total} respostas tuas foram do perfil ${rec.curso_arquetipo}, o perfil deste curso.`
                  : `Este curso é do perfil ${rec.curso_arquetipo}.`
              }
            >
              {perfil?.total > 0 && (
                <>
                  <ul className="flex flex-col gap-2">
                    {perfil.arquetipos.map((a) => {
                      const doCursoAqui = a.arquetipo === rec.curso_arquetipo;
                      return (
                        <li key={a.arquetipo} className="grid grid-cols-[104px_1fr_44px] items-center gap-3 text-[14px]">
                          <span className={doCursoAqui ? "font-bold text-primaria-escura" : "text-texto-suave"}>{a.arquetipo}</span>
                          <span className="h-3 overflow-hidden rounded-full bg-fundo ring-1 ring-borda/70">
                            <span
                              className={`block h-full rounded-full ${doCursoAqui ? "bg-primaria" : "bg-[#cfd5df]"}`}
                              style={{ width: `${percentagem(a.percentagem)}%` }}
                            />
                          </span>
                          <span className={`text-right tabular-nums ${doCursoAqui ? "font-bold" : "text-texto-suave"}`}>{percentagem(a.percentagem)}%</span>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </Passo>
          </ol>
        </section>

        {/* A soma */}
        <section className="rounded-[16px] border-[1.5px] border-borda bg-white p-6 md:p-8" aria-labelledby="soma-titulo">
          <h2 id="soma-titulo" className="mb-5 text-[20px] font-bold">Como chegámos aos {percentagem(rec.score_final)}%</h2>
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <BlocoFormula rotulo="Notas" valor={percentagem(rec.score_academico)} peso="60%" />
            <Plus className="h-5 w-5 shrink-0 self-center text-texto-suave" aria-hidden="true" />
            <BlocoFormula rotulo="Teste" valor={percentagem(rec.score_psicografico)} peso="40%" />
            <Equal className="h-5 w-5 shrink-0 self-center text-texto-suave" aria-hidden="true" />
            <div className="flex flex-1 justify-center">
              <Compatibilidade rec={rec} tamanho={96} />
            </div>
          </div>
          <OQueQuerDizer>{leituraSoma(rec, primeira)}</OQueQuerDizer>
        </section>

        {/* Próximos passos */}
        <section className="mt-8 rounded-[16px] border-[1.5px] border-borda bg-white p-6 md:p-8" aria-labelledby="passos-titulo">
          <h2 id="passos-titulo" className="mb-5 text-[20px] font-bold">Próximos passos</h2>
          <ol className="mb-5 flex flex-col gap-3.5">
            {proximosPassos(rec).map((p, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-snug">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primaria-clara text-[13px] font-bold text-primaria-escura">{i + 1}</span>
                <span className="pt-1">{p}</span>
              </li>
            ))}
          </ol>
          <p className="flex items-start gap-2.5 rounded-[10px] bg-primaria-clara px-4 py-3 text-[14px] text-primaria-escura">
            <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Esta é uma sugestão baseada nas tuas notas e nas tuas respostas. A decisão final é sempre tua.
          </p>
        </section>

        <AvisoVinteQuatroHoras className="mt-8" />
        <div className="mt-5 flex flex-col-reverse justify-center gap-3 sm:flex-row">
          {escolhida ? (
            <>
              <Link to="/aluno/curso-escolhido" className={BOTAO_SECUNDARIO}>Ver a tua escolha</Link>
              <Link to="/" className={BOTAO_PRINCIPAL}>Voltar ao início</Link>
            </>
          ) : (
            <>
              <Link to="/aluno/resultado" className={BOTAO_SECUNDARIO}>Ver as outras sugestões</Link>
              <button type="button" onClick={() => setAConfirmar(rec)} className={BOTAO_PRINCIPAL}>Escolher este curso</button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-fundo">
      <CabecalhoPercurso passo={4} voltarPara={escolhida ? "/aluno/curso-escolhido" : "/aluno/resultado"} />
      <main className="flex-1 px-4 pb-16 pt-6 sm:px-6 md:pt-12 lg:px-12">{conteudo}</main>
      <ConfirmarEscolha
        rec={aConfirmar}
        aEscolher={aEscolher}
        erro={aConfirmar ? erro : null}
        aoConfirmar={confirmar}
        aoFechar={fecharConfirmacao}
      />
    </div>
  );
}
