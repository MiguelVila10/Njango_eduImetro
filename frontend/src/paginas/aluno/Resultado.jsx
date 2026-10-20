// Sugestões de cursos (passo 4): design Figma "Qual destes cursos queres
// escolher?" com a secção "Como foram escolhidos" do design Stitch.
// Cada cartão tem "Ver o curso" (detalhe) e "Escolher este curso" (pede
// confirmação; a escolha é definitiva). Se nenhum curso cumprir as notas
// mínimas, mostra os mais próximos e o que falta em cada disciplina.

import { Building2, Info, LoaderCircle, RefreshCw, Sparkles, Users } from "lucide-react";
import { useCallback, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import CabecalhoPercurso from "../../componentes/CabecalhoPercurso";
import {
  AvisoVinteQuatroHoras, BOTAO_PRINCIPAL, BOTAO_SECUNDARIO, ConfirmarEscolha, razaoCurta,
} from "../../componentes/sugestoes";
import { useRecomendacoes } from "../../hooks/useRecomendacoes";
import { sessaoAluno } from "../../sessao/sessaoAluno";

function CartaoCurso({ rec, aoEscolher }) {
  const primeiro = rec.rank === 1;
  return (
    <article
      aria-labelledby={`curso-${rec.id}`}
      className={`rounded-[16px] border-[1.5px] bg-white p-6 md:p-8 ${primeiro ? "border-primaria/40 shadow-[0_10px_28px_rgba(31,111,192,0.10)]" : "border-borda"}`}
    >
      {primeiro && (
        <p className="mb-4 inline-flex items-center gap-1.5 rounded-[8px] bg-primaria-clara px-3 py-1.5 text-[13px] font-bold text-primaria-escura">
          <Sparkles className="h-4 w-4" aria-hidden="true" /> A que mais combina contigo
        </p>
      )}
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-8">
        <div className="flex flex-1 gap-4">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[15px] font-bold ${primeiro ? "bg-primaria-clara text-primaria" : "bg-fundo text-texto ring-1 ring-borda"}`}
            aria-label={`${rec.rank}.ª sugestão`}
          >
            {rec.rank}.º
          </span>
          <div className="min-w-0 flex-1">
            <h2 id={`curso-${rec.id}`} className="text-[20px] font-bold leading-snug md:text-[22px]">
              {rec.curso_nome}
              <span className="ml-2 inline-block whitespace-nowrap text-[14px] font-medium text-texto-suave">— {rec.curso_instituicao}</span>
            </h2>
            <p className="mt-1.5 text-[15px] leading-relaxed text-texto-suave md:text-[16px]">{razaoCurta(rec)}</p>
            {rec.disciplinas_chave?.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2" aria-label="Disciplinas que mais contam">
                {rec.disciplinas_chave.slice(0, 3).map((d) => (
                  <li key={d.disciplina} className="rounded-[8px] bg-fundo px-2.5 py-1 text-[13px] ring-1 ring-borda">
                    {d.disciplina}
                    {d.tua_nota != null && <span className="ml-1 font-bold tabular-nums">({d.tua_nota})</span>}
                  </li>
                ))}
              </ul>
            )}
            <Link to={`/aluno/curso/${rec.id}`} className="mt-3 inline-block text-[15px] font-semibold text-primaria underline underline-offset-2 hover:text-primaria-escura">
              Ver o curso
            </Link>
          </div>
        </div>
        <button type="button" onClick={() => aoEscolher(rec)} className={`${BOTAO_PRINCIPAL} w-full md:w-auto md:px-8`}>
          Escolher este curso
        </button>
      </div>
    </article>
  );
}

function ComoForamEscolhidos({ total }) {
  const passos = [
    ["Notas mínimas", "Ficaram de fora os cursos que pedem uma nota mínima que ainda não tens em alguma disciplina."],
    ["Notas parecidas com as ideais", "Comparámos as tuas 12 notas com as notas ideais de cada curso, sobretudo nas disciplinas que mais contam."],
    ["As tuas respostas ao teste", "Vimos que tipo de actividades escolheste no teste e que cursos combinam com essas escolhas."],
  ];
  return (
    <section className="mt-12 rounded-[16px] border-[1.5px] border-borda bg-white p-6 md:p-8" aria-labelledby="como-titulo">
      <h2 id="como-titulo" className="mb-1 text-[20px] font-bold md:text-[22px]">
        Como foram escolhidos {total === 1 ? "este curso" : `estes ${total} cursos`}?
      </h2>
      <p className="mb-6 text-[15px] text-texto-suave">O Njango Edu junta as tuas notas e as tuas respostas em três passos.</p>
      <ol className="mb-6 grid gap-4 md:grid-cols-3">
        {passos.map(([titulo, texto], i) => (
          <li key={titulo} className="rounded-[12px] bg-primaria-clara/60 p-5">
            <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-[8px] bg-primaria text-[15px] font-bold text-white">{i + 1}</span>
            <h3 className="mb-1.5 text-[16px] font-bold">{titulo}</h3>
            <p className="text-[14px] leading-relaxed text-texto-suave">{texto}</p>
          </li>
        ))}
      </ol>
      <div className="flex items-start gap-3 rounded-[12px] bg-fundo p-4 ring-1 ring-borda">
        <Users className="mt-0.5 h-5 w-5 shrink-0 text-primaria" aria-hidden="true" />
        <p className="text-[14px] leading-relaxed">
          <strong className="font-semibold">Conselho importante:</strong> estas sugestões são uma ajuda. Conversa com
          a tua família e com os teus professores antes de tomares a decisão final.
        </p>
      </div>
    </section>
  );
}

function SemCursoCompativel({ cursos }) {
  return (
    <div className="mx-auto w-full max-w-[832px]">
      <h1 className="mb-3 text-[28px] font-bold leading-tight md:text-[34px]">Ainda não há um curso compatível</h1>
      <p className="mb-6 text-[16px] leading-relaxed text-texto-suave md:text-[17px]">
        Cada curso pede uma nota mínima em algumas disciplinas, e as tuas notas ainda não chegam para nenhum. Estes
        são os cursos que estão mais perto. Vê o que falta em cada um.
      </p>
      <ol className="mb-6 flex flex-col gap-4">
        {cursos.map((c) => (
          <li key={c.curso} className="rounded-[16px] border-[1.5px] border-borda bg-white p-5 md:p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[18px] font-bold">{c.curso_nome}</h2>
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-texto-suave">
                <Building2 className="h-4 w-4" aria-hidden="true" /> {c.curso_instituicao}
              </span>
            </div>
            <ul className="flex flex-col gap-2">
              {c.faltas.map((f) => (
                <li key={f.disciplina} className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] bg-fundo px-4 py-2.5 text-[14px]">
                  <span className="font-semibold">{f.disciplina}</span>
                  <span className="text-texto-suave">
                    tens <strong className="text-texto">{f.nota}</strong>, o curso pede <strong className="text-texto">{f.nota_min}</strong>
                    <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[12px] font-semibold text-amber-800">faltam {f.falta}</span>
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      <div className="flex items-start gap-3.5 rounded-[8px] border border-primaria/20 bg-primaria-clara p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-primaria-escura" aria-hidden="true" />
        <p className="text-[14px] font-medium leading-relaxed">
          Fala com o orientador da tua escola. Ele pode ajudar-te a melhorar estas disciplinas ou a encontrar outros caminhos.
        </p>
      </div>
    </div>
  );
}

export default function Resultado() {
  const navegar = useNavigate();
  const { alunoId } = sessaoAluno();
  const { recomendacoes, cursosProximos, escolhida, carregando, aEscolher, erro, escolher, recarregar } =
    useRecomendacoes(alunoId);
  const [aConfirmar, setAConfirmar] = useState(null);
  const [indeciso, setIndeciso] = useState(false);
  const fecharConfirmacao = useCallback(() => setAConfirmar(null), []);

  if (escolhida) return <Navigate to="/aluno/curso-escolhido" replace />;

  async function confirmar() {
    if (await escolher(aConfirmar.id)) navegar("/aluno/curso-escolhido");
  }

  let conteudo;
  if (carregando) {
    conteudo = (
      <div className="mx-auto w-full max-w-[832px]" aria-live="polite">
        <p className="mb-8 flex items-center gap-3 text-[16px] font-medium text-texto-suave">
          <LoaderCircle className="h-5 w-5 animate-spin text-primaria" aria-hidden="true" />
          A juntar as tuas notas e as tuas respostas…
        </p>
        <div className="flex animate-pulse flex-col gap-5">
          {[0, 1, 2].map((i) => <div key={i} className="h-[170px] rounded-[16px] bg-borda/60" />)}
        </div>
      </div>
    );
  } else if (cursosProximos) {
    conteudo = <SemCursoCompativel cursos={cursosProximos} />;
  } else if (!recomendacoes.length) {
    conteudo = (
      <div className="mx-auto mt-6 w-full max-w-[560px] rounded-[16px] border-[1.5px] border-borda bg-white p-8 text-center">
        <h1 className="mb-2 text-[22px] font-bold">Não foi possível calcular as sugestões</h1>
        <p className="mb-6 text-texto-suave">{erro?.message ?? "Verifica a ligação e tenta novamente."}</p>
        <button type="button" onClick={recarregar} className={`${BOTAO_PRINCIPAL} mx-auto w-full sm:w-auto`}>
          <RefreshCw className="h-[18px] w-[18px]" aria-hidden="true" /> Tentar novamente
        </button>
      </div>
    );
  } else {
    conteudo = (
      <div className="mx-auto w-full max-w-[832px]">
        <h1 className="mb-2 text-[28px] font-bold leading-tight md:text-[34px]">Qual destes cursos queres escolher?</h1>
        <p className="mb-8 text-[16px] leading-relaxed text-texto-suave md:text-[17px]">
          Escolhe o curso que mais te interessa. A tua escolha fica registada para o orientador te poder acompanhar.
        </p>

        <div className="flex flex-col gap-5">
          {recomendacoes.map((r) => <CartaoCurso key={r.id} rec={r} aoEscolher={setAConfirmar} />)}
        </div>

        <div className="mt-8 flex flex-col items-center text-center">
          {indeciso ? (
            <div role="status" className="w-full rounded-[16px] border-[1.5px] border-borda bg-white p-6">
              <p className="mb-1 text-[17px] font-bold">Não faz mal decidir mais tarde</p>
              <p className="mb-5 text-[15px] leading-relaxed text-texto-suave">
                Os teus resultados ficam guardados neste dispositivo durante 24 horas. Conversa com a tua família e com
                os teus professores e volta quando tiveres decidido.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <button type="button" onClick={() => setIndeciso(false)} className={BOTAO_SECUNDARIO}>Ver os cursos outra vez</button>
                <Link to="/" className={BOTAO_PRINCIPAL}>Voltar ao início</Link>
              </div>
            </div>
          ) : (
            <>
              <button type="button" onClick={() => setIndeciso(true)} className={`${BOTAO_SECUNDARIO} w-full sm:w-auto sm:px-8`}>
                Ainda não decidi
              </button>
              <p className="mt-3 text-[14px] text-texto-suave">Não faz mal. Podes falar primeiro com a tua família e com os teus professores.</p>
            </>
          )}
        </div>

        <ComoForamEscolhidos total={recomendacoes.length} />
        <AvisoVinteQuatroHoras className="mt-8" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-fundo">
      <CabecalhoPercurso passo={4} voltarPara="/aluno/teste" />
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
