// Sugestões de cursos (passo 4): design Figma "Qual destes cursos queres
// escolher?" com a secção "Como foram escolhidos" do design Stitch.
// Cada cartão tem "Ver o curso" (detalhe) e "Escolher este curso" (pede
// confirmação; a escolha é definitiva). Se nenhum curso cumprir as notas
// mínimas, mostra os mais próximos e o que falta em cada disciplina.

import { ArrowRight, Building2, Info, LoaderCircle, Lock, RefreshCw, Sparkles, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { cursosQuaseCompativeis, listarNotas } from "../../api/aluno";
import CabecalhoPercurso from "../../componentes/CabecalhoPercurso";
import { IconeCurso } from "../../componentes/cursoVisual";
import { PanoramaPerfil, resumoSugestao } from "../../componentes/explicacao";
import {
  AvisoVinteQuatroHoras, BOTAO_PRINCIPAL, BOTAO_SECUNDARIO, Compatibilidade, ConfirmarEscolha, percentagem,
} from "../../componentes/sugestoes";
import { useRecomendacoes } from "../../hooks/useRecomendacoes";
import { sessaoAluno } from "../../sessao/sessaoAluno";

function CartaoCurso({ rec, aoEscolher }) {
  const primeiro = rec.rank === 1;
  return (
    <article
      aria-labelledby={`curso-${rec.id}`}
      className={`rounded-[16px] border-[1.5px] bg-white p-6 md:p-7 ${primeiro ? "border-primaria/40 shadow-[0_10px_28px_rgba(31,111,192,0.10)]" : "border-borda"}`}
    >
      {primeiro && (
        <p className="mb-4 inline-flex items-center gap-1.5 rounded-[8px] bg-primaria-clara px-3 py-1.5 text-[13px] font-bold text-primaria-escura">
          <Sparkles className="h-4 w-4" aria-hidden="true" /> A que mais combina contigo
        </p>
      )}
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:gap-8">
        <div className="flex flex-1 gap-4">
          <div className="relative shrink-0">
            <IconeCurso nome={rec.curso_nome} className="h-14 w-14" />
            <span
              className={`absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[11px] font-bold ring-2 ring-white ${primeiro ? "bg-primaria text-white" : "bg-texto text-white"}`}
              aria-label={`${rec.rank}.ª sugestão`}
            >
              {rec.rank}.º
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 id={`curso-${rec.id}`} className="text-[20px] font-bold leading-snug md:text-[22px]">
              {rec.curso_nome}
              <span className="ml-2 inline-block whitespace-nowrap text-[14px] font-medium text-texto-suave">— {rec.curso_instituicao}</span>
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-texto-suave">{resumoSugestao(rec)}</p>
            <dl className="mt-3 flex flex-wrap gap-2 text-[13px]">
              <div className="flex items-center gap-1.5 rounded-[8px] bg-fundo px-2.5 py-1 ring-1 ring-borda">
                <dt className="text-texto-suave">Notas</dt>
                <dd className="font-bold tabular-nums">{percentagem(rec.score_academico)}%</dd>
              </div>
              <div className="flex items-center gap-1.5 rounded-[8px] bg-fundo px-2.5 py-1 ring-1 ring-borda">
                <dt className="text-texto-suave">Teste</dt>
                <dd className="font-bold tabular-nums">{percentagem(rec.score_psicografico)}%</dd>
              </div>
              <div className="flex items-center gap-1.5 rounded-[8px] bg-fundo px-2.5 py-1 ring-1 ring-borda">
                <dt className="text-texto-suave">Perfil</dt>
                <dd className="font-bold">{rec.curso_arquetipo}</dd>
              </div>
            </dl>
            <Link
              to={`/aluno/curso/${rec.id}`}
              className="mt-3 inline-flex items-center gap-1.5 text-[15px] font-semibold text-primaria hover:text-primaria-escura"
            >
              Ver o curso e porque foi sugerido <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
        {/* Ecrãs estreitos (≤ 360 px): o botão desce para baixo do anel e ocupa a largura toda. */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-5 md:flex-col md:flex-nowrap md:gap-4">
          <Compatibilidade rec={rec} />
          <button type="button" onClick={() => aoEscolher(rec)} className={`${BOTAO_PRINCIPAL} min-w-[200px] flex-1 md:w-auto md:flex-none md:px-8`}>
            Escolher este curso
          </button>
        </div>
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
        {total === 1 ? "Como foi escolhido este curso?" : `Como foram escolhidos estes ${total} cursos?`}
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

// Menos de 3 cursos cumprem as notas mínimas: mostra os que ficaram mais
// perto, com o que falta. Não se podem escolher (falham o filtro SE-ENTÃO).
function QuaseLa({ validos, cursos }) {
  if (!cursos.length) return null;
  return (
    <section className="mt-10" aria-labelledby="quase-titulo">
      <h2 id="quase-titulo" className="mb-1 text-[20px] font-bold md:text-[22px]">Quase lá</h2>
      <p className="mb-5 text-[15px] leading-relaxed text-texto-suave">
        {validos === 1 ? "Só 1 curso cumpre" : `Só ${validos} cursos cumprem`} as notas mínimas com as tuas notas. Estes
        ficaram perto: ainda não os podes escolher, mas vê o que falta em cada um.
      </p>
      <ul className="flex flex-col gap-4">
        {cursos.map((c) => (
          <li key={c.curso} className="rounded-[16px] border-[1.5px] border-dashed border-borda bg-white/70 p-5 md:p-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[18px] font-bold text-texto/80">
                {c.curso_nome}
                <span className="ml-2 inline-block whitespace-nowrap text-[14px] font-medium text-texto-suave">— {c.curso_instituicao}</span>
              </h3>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-fundo px-3 py-1 text-[12px] font-semibold text-texto-suave ring-1 ring-borda">
                <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Ainda não podes escolher
              </span>
            </div>
            <ul className="flex flex-col gap-2">
              {c.faltas.map((f) => (
                <li key={f.disciplina} className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] bg-fundo px-4 py-2.5 text-[14px]">
                  <span className="font-semibold">{f.disciplina}</span>
                  <span className="text-texto-suave">
                    tens <strong className="text-texto">{f.nota}</strong>, o curso pede <strong className="text-texto">{f.nota_min}</strong>
                    <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[12px] font-semibold text-amber-800">
                      {f.falta === 1 ? "falta 1 valor" : `faltam ${f.falta} valores`}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
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
  const [quase, setQuase] = useState([]);
  const [notas, setNotas] = useState(null);

  useEffect(() => {
    let activo = true;
    listarNotas()
      .then((lista) => activo && setNotas(Object.fromEntries(lista.map((n) => [n.disciplina, n.nota]))))
      .catch(() => {});
    return () => { activo = false; };
  }, []);

  // Só quando há 1 ou 2 sugestões: pede os cursos que ficaram mais perto.
  const nValidos = recomendacoes.length;
  useEffect(() => {
    if (nValidos === 0 || nValidos >= 3) return undefined;
    let activo = true;
    cursosQuaseCompativeis(alunoId).then((lista) => activo && setQuase(lista)).catch(() => {});
    return () => { activo = false; };
  }, [alunoId, nValidos]);

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
        <p className="-mt-5 mb-8 flex items-start gap-2 text-[14px] text-texto-suave">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primaria" aria-hidden="true" />
          A percentagem de compatibilidade junta as tuas notas (60%) e as tuas respostas ao teste (40%).
        </p>

        <PanoramaPerfil perfil={recomendacoes[0]?.perfil_aluno} notas={notas} />

        <div className="flex flex-col gap-5">
          {recomendacoes.map((r) => <CartaoCurso key={r.id} rec={r} aoEscolher={setAConfirmar} />)}
        </div>

        <QuaseLa validos={recomendacoes.length} cursos={quase} />

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
                <Link to="/aluno/resumo" className={BOTAO_SECUNDARIO}>Resumo para a família</Link>
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
