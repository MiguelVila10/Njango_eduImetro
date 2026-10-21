// Escolha registada (design Figma, Frame C): faixa verde de confirmação, as
// sugestões com a escolhida em destaque, próximos passos e o aviso das 24 horas.
// O botão "Resumo para a família" abre a folha A4 para imprimir ou guardar em PDF.

import { Check, ChevronRight, Printer } from "lucide-react";
import { Link, Navigate } from "react-router-dom";

import CabecalhoPercurso from "../../componentes/CabecalhoPercurso";
import {
  AvisoVinteQuatroHoras, BOTAO_PRINCIPAL, BOTAO_SECUNDARIO, proximosPassos, razaoCurta,
} from "../../componentes/sugestoes";
import { useRecomendacoes } from "../../hooks/useRecomendacoes";
import { sessaoAluno } from "../../sessao/sessaoAluno";

function CartaoSugestao({ rec }) {
  const escolhido = rec.escolhida_pelo_aluno;
  return (
    <article
      aria-labelledby={`sug-${rec.id}`}
      className={`rounded-[16px] bg-white p-6 md:p-8 ${escolhido ? "border-2 border-emerald-600" : "border-[1.5px] border-borda"}`}
    >
      {escolhido && (
        <p className="mb-4 inline-flex items-center gap-1.5 rounded-[8px] bg-emerald-50 px-3 py-1.5 text-[13px] font-bold text-emerald-700">
          <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /> A tua escolha
        </p>
      )}
      <div className={`flex gap-4 ${escolhido ? "" : "opacity-75"}`}>
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[15px] font-bold ${escolhido ? "bg-emerald-50 text-emerald-700" : "bg-fundo text-texto ring-1 ring-borda"}`}
          aria-label={`${rec.rank}.ª sugestão`}
        >
          {rec.rank}.º
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={`sug-${rec.id}`} className="text-[20px] font-bold leading-snug md:text-[22px]">
            {rec.curso_nome}
            <span className="ml-2 inline-block whitespace-nowrap text-[14px] font-medium text-texto-suave">— {rec.curso_instituicao}</span>
          </h2>
          <p className="mt-1.5 text-[15px] leading-relaxed text-texto-suave md:text-[16px]">{razaoCurta(rec)}</p>
          <Link to={`/aluno/curso/${rec.id}`} className="mt-3 inline-block text-[15px] font-semibold text-primaria underline underline-offset-2 hover:text-primaria-escura print:hidden">
            Ver o curso
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function CursoEscolhido() {
  const { alunoId, nome } = sessaoAluno();
  const { recomendacoes, escolhida, carregando, erro } = useRecomendacoes(alunoId);
  const primeiroNome = (nome ?? "").trim().split(/\s+/)[0];

  if (!carregando && !erro && !escolhida) return <Navigate to="/aluno/resultado" replace />;

  let conteudo;
  if (carregando) {
    conteudo = <div className="mx-auto h-[480px] w-full max-w-[832px] animate-pulse rounded-[16px] bg-borda/60" aria-label="A carregar" />;
  } else if (erro && !escolhida) {
    conteudo = <p role="alert" className="mx-auto max-w-[560px] rounded-lg bg-red-50 px-4 py-3 text-red-700">{erro.message}</p>;
  } else {
    conteudo = (
      <div className="mx-auto w-full max-w-[832px]">
        <section role="status" className="mb-6 flex items-start gap-4 rounded-[16px] border border-emerald-200 bg-emerald-50 p-6 md:items-center md:p-8">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
            <Check className="h-6 w-6" strokeWidth={3} aria-hidden="true" />
          </span>
          <div>
            <h1 className="mb-1 text-[24px] font-bold leading-tight md:text-[28px]">A tua escolha ficou registada</h1>
            <p className="text-[15px] text-texto-suave md:text-[16px]">
              Escolheste {escolhida.curso_nome}, no {escolhida.curso_instituicao}. Boa sorte nesta nova etapa
              {primeiroNome ? `, ${primeiroNome}` : ""}!
            </p>
          </div>
        </section>

        <div className="flex flex-col gap-5">
          {recomendacoes.map((r) => <CartaoSugestao key={r.id} rec={r} />)}
        </div>

        <section className="mt-6 rounded-[16px] border-[1.5px] border-borda bg-white p-6 md:p-8" aria-labelledby="passos-titulo">
          <h2 id="passos-titulo" className="mb-5 text-[20px] font-bold md:text-[22px]">Próximos passos</h2>
          <ul className="flex flex-col gap-3.5">
            {[...proximosPassos(escolhida).slice(0, 2), "Se tiveres dúvidas, procura o orientador da tua escola."].map((p) => (
              <li key={p} className="flex items-start gap-3 text-[15px] leading-snug md:text-[16px]">
                <span className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primaria-clara text-primaria">
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-8 flex flex-col items-center justify-between gap-5 md:flex-row">
          <AvisoVinteQuatroHoras />
          <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row print:hidden">
            <Link to="/aluno/resumo" className={BOTAO_SECUNDARIO}>
              <Printer className="h-[18px] w-[18px]" aria-hidden="true" /> Resumo para a família
            </Link>
            <Link to="/" className={BOTAO_PRINCIPAL}>Voltar ao início</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-fundo">
      <div className="print:hidden">
        <CabecalhoPercurso passo={4} voltarPara="/" concluido />
      </div>
      <main className="flex-1 px-4 pb-16 pt-6 sm:px-6 md:pt-12 lg:px-12 print:p-0">{conteudo}</main>
    </div>
  );
}
