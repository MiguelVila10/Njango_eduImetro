import { listarCursos } from "../../api/orientador";
import { ACarregar, EcraProvisorio, MensagemErro } from "../../componentes/base";
import { useCarregar } from "../../hooks/useCarregar";

export default function Cursos() {
  const { dados, erro, carregando } = useCarregar(listarCursos);
  if (carregando) return <EcraProvisorio titulo="Cursos" largo><ACarregar /></EcraProvisorio>;
  if (erro) return <EcraProvisorio titulo="Cursos" largo><MensagemErro erro={erro} /></EcraProvisorio>;

  return (
    <EcraProvisorio titulo="Cursos" largo>
      <p className="mb-4 text-sm text-slate-600">O formulário de adicionar curso entra com o ecrã do design.</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] bg-white text-left text-sm">
          <thead><tr className="border-b text-slate-500">
            <th className="p-2">Curso</th><th>Instituição</th><th>Perfil</th><th>Sugerido</th><th>1.º lugar</th><th>Escolhido</th>
          </tr></thead>
          <tbody>
            {dados.map((c) => (
              <tr key={c.id} className="border-b border-slate-100">
                <td className="p-2">{c.nome}</td><td>{c.instituicao}</td><td>{c.arquetipo_dominante}</td>
                <td className="tabular-nums">{c.vezes_sugerido}</td><td className="tabular-nums">{c.vezes_primeiro}</td><td className="tabular-nums">{c.vezes_escolhido}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </EcraProvisorio>
  );
}
