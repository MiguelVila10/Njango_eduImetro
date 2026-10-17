import { Link } from "react-router-dom";

import { listarAlunos } from "../../api/orientador";
import { ACarregar, EcraProvisorio, MensagemErro } from "../../componentes/base";
import { useCarregar } from "../../hooks/useCarregar";

export const NOME_ESTADO = {
  por_terminar: "Por terminar",
  sem_curso_compativel: "Sem curso compatível",
  concluido: "Concluído",
  ponto_de_atencao: "Ponto de atenção",
};

export default function Alunos() {
  const { dados, erro, carregando } = useCarregar(listarAlunos);
  if (carregando) return <EcraProvisorio titulo="Alunos" largo><ACarregar /></EcraProvisorio>;
  if (erro) return <EcraProvisorio titulo="Alunos" largo><MensagemErro erro={erro} /></EcraProvisorio>;

  return (
    <EcraProvisorio titulo="Alunos" largo>
      {dados.length === 0 ? <p className="text-sm text-slate-600">Ainda nenhum aluno fez o teste.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] bg-white text-left text-sm">
            <thead><tr className="border-b text-slate-500">
              <th className="p-2">Nome</th><th>Escola</th><th>Estado</th><th>Perfil</th><th>1.ª sugestão</th><th>Escolha</th>
            </tr></thead>
            <tbody>
              {dados.map((a) => (
                <tr key={a.id} className="border-b border-slate-100">
                  <td className="p-2"><Link className="underline" to={`/orientador/alunos/${a.id}`}>{a.nome}</Link></td>
                  <td>{a.escola}</td>
                  <td>{NOME_ESTADO[a.estado]}</td>
                  <td>{a.perfil_dominante ?? "—"}</td>
                  <td>{a.primeira_sugestao?.nome ?? "—"}</td>
                  <td>{a.curso_escolhido?.nome ?? "Ainda não decidiu"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </EcraProvisorio>
  );
}
