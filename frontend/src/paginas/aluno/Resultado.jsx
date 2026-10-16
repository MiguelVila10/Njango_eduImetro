import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { ACarregar, Botao, EcraProvisorio, MensagemErro } from "../../componentes/base";
import { useRecomendacoes } from "../../hooks/useRecomendacoes";
import { sessaoAluno } from "../../sessao/sessaoAluno";

const percentagem = (v) => `${Math.round(v * 100)}%`;

export default function Resultado() {
  const navegar = useNavigate();
  const { alunoId } = sessaoAluno();
  const { recomendacoes, cursosProximos, escolhida, carregando, aEscolher, erro, escolher } =
    useRecomendacoes(alunoId);
  const [aConfirmar, setAConfirmar] = useState(null);

  if (carregando) return <EcraProvisorio titulo="Os teus cursos"><ACarregar texto="A calcular os teus cursos…" /></EcraProvisorio>;
  if (escolhida) return <Navigate to="/aluno/curso-escolhido" replace />;

  if (cursosProximos) {
    return (
      <EcraProvisorio titulo="Ainda não há um curso compatível">
        <p className="mb-4 text-slate-700">Estes são os cursos que estão mais perto. Vê o que te falta:</p>
        <ul className="space-y-4">
          {cursosProximos.map((c) => (
            <li key={c.curso} className="rounded border border-slate-200 p-4">
              <p className="font-medium">{c.curso_nome} <span className="text-slate-500">({c.curso_instituicao})</span></p>
              <ul className="mt-2 text-sm text-slate-700">
                {c.faltas.map((f) => (
                  <li key={f.disciplina}>{f.disciplina}: tens {f.nota}, precisas de {f.nota_min}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </EcraProvisorio>
    );
  }

  async function confirmar() {
    if (await escolher(aConfirmar.id)) navegar("/aluno/curso-escolhido");
  }

  return (
    <EcraProvisorio titulo="Os cursos que combinam contigo">
      <MensagemErro erro={erro} />
      <ol className="space-y-4">
        {recomendacoes.map((r) => (
          <li key={r.id} className="rounded border border-slate-200 p-4">
            <p className="text-xs text-slate-500">{r.rank}.º lugar · {percentagem(r.score_final)} de compatibilidade</p>
            <p className="text-lg font-medium">{r.curso_nome}</p>
            <p className="text-sm text-slate-600">{r.curso_instituicao} · perfil {r.curso_arquetipo}</p>
            <Botao className="mt-3" variante="secundario" onClick={() => setAConfirmar(r)}>Escolher este curso</Botao>
          </li>
        ))}
      </ol>

      {aConfirmar && (
        <div role="dialog" aria-modal="true" aria-labelledby="confirmar-titulo" className="fixed inset-0 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded bg-white p-5">
            <h2 id="confirmar-titulo" className="mb-2 font-semibold">Confirmar {aConfirmar.curso_nome}?</h2>
            <p className="mb-4 text-sm text-slate-600">Depois de confirmar, a escolha fica registada e não pode ser mudada.</p>
            <div className="flex gap-3">
              <Botao onClick={confirmar} disabled={aEscolher}>Confirmar</Botao>
              <Botao variante="secundario" onClick={() => setAConfirmar(null)} disabled={aEscolher}>Voltar</Botao>
            </div>
          </div>
        </div>
      )}
    </EcraProvisorio>
  );
}
