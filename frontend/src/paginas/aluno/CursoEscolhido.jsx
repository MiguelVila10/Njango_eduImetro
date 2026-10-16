import { Navigate } from "react-router-dom";

import { ACarregar, EcraProvisorio, MensagemErro } from "../../componentes/base";
import { useRecomendacoes } from "../../hooks/useRecomendacoes";
import { sessaoAluno } from "../../sessao/sessaoAluno";

const percentagem = (v) => `${Math.round(v * 100)}%`;

export default function CursoEscolhido() {
  const { alunoId } = sessaoAluno();
  const { escolhida, carregando, erro } = useRecomendacoes(alunoId);

  if (carregando) return <EcraProvisorio titulo="O teu curso"><ACarregar /></EcraProvisorio>;
  if (erro) return <EcraProvisorio titulo="O teu curso"><MensagemErro erro={erro} /></EcraProvisorio>;
  if (!escolhida) return <Navigate to="/aluno/resultado" replace />;

  return (
    <EcraProvisorio titulo={`Escolheste ${escolhida.curso_nome}`}>
      <p className="mb-4 text-slate-600">{escolhida.curso_instituicao} · a tua escolha ficou registada.</p>
      {escolhida.curso_descricao && <p className="mb-6 text-slate-800">{escolhida.curso_descricao}</p>}

      <h2 className="mb-2 font-semibold">Porque te sugerimos este curso</h2>
      <p className="mb-3 text-sm text-slate-700">
        As tuas notas combinam {percentagem(escolhida.score_academico)} com o que o curso pede, e as tuas
        respostas combinam {percentagem(escolhida.score_psicografico)} com o perfil {escolhida.curso_arquetipo}.
      </p>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b text-slate-500"><th className="py-1">Disciplina</th><th>A tua nota</th><th>Referência do curso</th></tr>
        </thead>
        <tbody>
          {escolhida.disciplinas_chave.map((d) => (
            <tr key={d.disciplina} className="border-b border-slate-100">
              <td className="py-1">{d.disciplina}</td><td>{d.tua_nota ?? "—"}</td><td>{d.referencia}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </EcraProvisorio>
  );
}
