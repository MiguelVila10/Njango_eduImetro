// Detalhe de um curso sugerido (design Stitch "O teu curso"): o que se
// aprende, disciplinas que mais contam, porque foi sugerido (3 passos do
// motor), as notas do aluno ao lado das notas ideais e próximos passos.
// Se o aluno ainda não escolheu, pode escolher este curso daqui.

import { Check, CircleAlert, Info, Lightbulb } from "lucide-react";
import { useCallback, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";

import CabecalhoPercurso from "../../componentes/CabecalhoPercurso";
import {
  AvisoVinteQuatroHoras, BOTAO_PRINCIPAL, BOTAO_SECUNDARIO, ConfirmarEscolha, proximosPassos,
} from "../../componentes/sugestoes";
import { useRecomendacoes } from "../../hooks/useRecomendacoes";
import { sessaoAluno } from "../../sessao/sessaoAluno";

const NOTA_TOPO = 20;

function juntar(lista) {
  if (lista.length <= 1) return lista.join("");
  return `${lista.slice(0, -1).join(", ")} e ${lista[lista.length - 1]}`;
}

function textoNotasMinimas(rec) {
  const req = rec.notas_minimas ?? [];
  if (!req.length) return "Este curso não pede notas mínimas em disciplinas específicas, por isso entrou na tua lista.";
  const pede = juntar(req.map((r) => `${r.nota_min} a ${r.disciplina}`));
  const tens = juntar(req.map((r) => String(r.tua_nota ?? "—")));
  return `Este curso pede pelo menos ${pede}. Tu tens ${tens}. Por isso, o curso entrou na tua lista.`;
}

function textoNotasParecidas(score) {
  const quanto = score >= 0.85 ? "muito parecidas" : score >= 0.7 ? "parecidas" : "parecidas em algumas disciplinas";
  return `Comparámos as tuas 12 notas com as notas ideais para este curso. As tuas são ${quanto}, sobretudo nas disciplinas que mais contam.`;
}

function textoRespostas(rec) {
  const em10 = Math.round((rec.score_psicografico ?? 0) * 10);
  if (em10 >= 2) {
    return `No teste, ${em10} em cada 10 respostas tuas apontaram para o perfil ${rec.curso_arquetipo}, que é o perfil deste curso.`;
  }
  return `Este curso entrou sobretudo pelas tuas notas: no teste, poucas respostas apontaram para o perfil ${rec.curso_arquetipo}.`;
}

function Passo({ numero, titulo, texto, ok = true }) {
  return (
    <li className="flex flex-col rounded-[14px] border-[1.5px] border-borda bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <span className={`flex h-8 w-8 items-center justify-center rounded-full ${ok ? "bg-emerald-50 text-emerald-700" : "bg-fundo text-texto-suave"}`}>
          {ok ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /> : <Info className="h-4 w-4" aria-hidden="true" />}
        </span>
        <span className="rounded-full bg-primaria-clara px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-primaria-escura">
          Passo {numero}
        </span>
      </div>
      <h3 className="mb-2 text-[16px] font-bold leading-snug">{titulo}</h3>
      <p className="text-[14px] leading-relaxed text-texto-suave">{texto}</p>
    </li>
  );
}

function BarraNota({ rotulo, valor, cor }) {
  return (
    <div className="grid grid-cols-[84px_1fr] items-center gap-3">
      <span className={`text-[12px] leading-tight ${cor === "azul" ? "font-semibold text-primaria" : "text-texto-suave"}`}>{rotulo}</span>
      <div className="h-3 overflow-hidden rounded-full bg-fundo ring-1 ring-borda/60">
        <div
          className={`flex h-full items-center justify-end rounded-full pr-1.5 text-[10px] font-bold ${cor === "azul" ? "bg-primaria text-white" : "bg-[#cfd5df] text-texto"}`}
          style={{ width: `${Math.max(12, ((valor ?? 0) / NOTA_TOPO) * 100)}%` }}
        >
          {valor ?? "—"}
        </div>
      </div>
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
    const chave = rec.disciplinas_chave ?? [];
    const abaixo = chave.filter((d) => d.tua_nota != null && d.tua_nota < d.referencia);

    conteudo = (
      <div className="mx-auto w-full max-w-[880px]">
        {/* Cabeçalho do curso */}
        <section className="mb-8 rounded-[20px] bg-primaria-clara px-6 py-8 md:px-10 md:py-10">
          <div className="mb-4 flex flex-wrap gap-2">
            {eEscolhido && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[13px] font-semibold text-emerald-700">
                <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" /> A tua escolha
              </span>
            )}
            <span className="rounded-full bg-primaria px-3 py-1 text-[13px] font-semibold text-white">{rec.rank}.ª sugestão</span>
          </div>
          <h1 className="mb-2 text-[32px] font-bold leading-tight md:text-[40px]">{rec.curso_nome}</h1>
          <p className="mb-5 text-[17px] text-texto-suave">{rec.curso_instituicao}</p>
          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[13px] font-semibold text-primaria-escura ring-1 ring-borda">
            <span className="h-2 w-2 rounded-full bg-primaria" aria-hidden="true" /> Perfil do curso: {rec.curso_arquetipo}
          </span>
        </section>

        {/* Sobre o curso */}
        <div className="grid gap-5 md:grid-cols-2">
          <section className="rounded-[16px] border-[1.5px] border-borda bg-white p-6">
            <h2 className="mb-3 text-[20px] font-bold">O que vais aprender</h2>
            <p className="text-[15px] leading-relaxed text-texto-suave">
              {rec.curso_descricao || `Para saberes o que se aprende neste curso, informa-te junto do ${rec.curso_instituicao}.`}
            </p>
          </section>
          <section className="rounded-[16px] border-[1.5px] border-borda bg-white p-6">
            <h2 className="mb-3 text-[20px] font-bold">Disciplinas que mais contam</h2>
            <ul className="flex flex-wrap gap-2">
              {chave.map((d) => (
                <li key={d.disciplina} className="rounded-[8px] bg-primaria-clara px-3 py-1.5 text-[14px] font-semibold text-primaria-escura">
                  {d.disciplina}
                </li>
              ))}
            </ul>
          </section>
        </div>
        <p className="mt-3 text-[13px] text-texto-suave">
          Para saberes mais sobre o curso e a inscrição, informa-te junto do {rec.curso_instituicao}.
        </p>

        {/* Porque te sugerimos */}
        <section className="mt-12" aria-labelledby="porque-titulo">
          <h2 id="porque-titulo" className="mb-5 text-[22px] font-bold md:text-[24px]">Porque te sugerimos este curso</h2>
          <ol className="grid gap-4 md:grid-cols-3">
            <Passo numero={1} titulo="Tens as notas mínimas" texto={textoNotasMinimas(rec)} />
            <Passo numero={2} titulo="As tuas notas combinam com o curso" texto={textoNotasParecidas(rec.score_academico)} />
            <Passo
              numero={3}
              titulo="Combina com as tuas respostas"
              texto={textoRespostas(rec)}
              ok={Math.round((rec.score_psicografico ?? 0) * 10) >= 2}
            />
          </ol>
          <p className="mt-4 rounded-[12px] border-[1.5px] border-borda bg-white px-5 py-4 text-center text-[15px] font-semibold text-primaria">
            Juntando estes três pontos, {rec.curso_nome} ficou em {rec.rank}.º lugar nas tuas sugestões.
          </p>
        </section>

        {/* As tuas notas e o que o curso pede */}
        {chave.length > 0 && (
          <section className="mt-12 rounded-[16px] border-[1.5px] border-borda bg-white p-6 md:p-8" aria-labelledby="notas-titulo">
            <h2 id="notas-titulo" className="mb-1 text-[22px] font-bold">As tuas notas e o que o curso pede</h2>
            <p className="mb-5 text-[15px] text-texto-suave">Nas disciplinas que mais contam, vê como estás em relação ao que o curso pede.</p>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-borda pb-4 text-[13px]">
              <div className="flex gap-5">
                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-[3px] bg-primaria" aria-hidden="true" /> A tua nota</span>
                <span className="flex items-center gap-2 text-texto-suave"><span className="h-3 w-3 rounded-[3px] bg-[#cfd5df]" aria-hidden="true" /> Ideal para o curso</span>
              </div>
              <span className="text-texto-suave">Escala: 10 a 20 valores</span>
            </div>
            <ul className="flex flex-col divide-y divide-borda">
              {chave.map((d) => {
                const noNivel = d.tua_nota != null && d.tua_nota >= d.referencia;
                return (
                  <li key={d.disciplina} className="grid gap-3 py-4 md:grid-cols-[170px_1fr_150px] md:items-center md:gap-5">
                    <span className="text-[15px] font-bold">{d.disciplina}</span>
                    <div className="flex flex-col gap-1.5">
                      <BarraNota rotulo="A tua nota" valor={d.tua_nota} cor="azul" />
                      <BarraNota rotulo="Ideal para o curso" valor={d.referencia} cor="cinza" />
                    </div>
                    <span
                      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold md:justify-self-end ${
                        noNivel ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {noNivel ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" /> : <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />}
                      {noNivel ? "Estás no nível" : "Podes melhorar"}
                    </span>
                  </li>
                );
              })}
            </ul>
            {abaixo.length > 0 && (
              <div className="mt-4 flex items-start gap-3 rounded-[12px] border border-amber-200 bg-amber-50 p-4 text-[14px] leading-relaxed text-amber-900">
                <Lightbulb className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <p>
                  <strong className="font-semibold">Onde podes melhorar:</strong>{" "}
                  {abaixo
                    .map((d) => {
                      const diff = d.referencia - d.tua_nota;
                      return `em ${d.disciplina} estás ${diff} ${diff === 1 ? "valor" : "valores"} abaixo do ideal`;
                    })
                    .join("; ")}
                  . Se te esforçares {abaixo.length === 1 ? "nesta disciplina" : "nestas disciplinas"}, vais sentir-te mais à vontade no curso.
                </p>
              </div>
            )}
          </section>
        )}

        {/* Próximos passos */}
        <section className="mt-8 rounded-[16px] border-[1.5px] border-borda bg-white p-6 md:p-8" aria-labelledby="passos-titulo">
          <h2 id="passos-titulo" className="mb-5 text-[22px] font-bold">Próximos passos</h2>
          <ol className="mb-5 flex flex-col gap-3.5">
            {proximosPassos(rec).map((p, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-snug">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primaria-clara text-[12px] font-bold text-primaria-escura">{i + 1}</span>
                <span className="pt-0.5">{p}</span>
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
