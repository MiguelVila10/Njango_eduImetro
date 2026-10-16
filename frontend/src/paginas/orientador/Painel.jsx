import { painelResumo } from "../../api/orientador";
import { ACarregar, EcraProvisorio, MensagemErro } from "../../componentes/base";
import { useCarregar } from "../../hooks/useCarregar";

export default function Painel() {
  const { dados, erro, carregando } = useCarregar(painelResumo);
  if (carregando) return <EcraProvisorio titulo="Painel" largo><ACarregar /></EcraProvisorio>;
  if (erro) return <EcraProvisorio titulo="Painel" largo><MensagemErro erro={erro} /></EcraProvisorio>;

  const numeros = [
    ["Alunos", dados.total_alunos],
    ["Testes por terminar", dados.testes_por_terminar],
    ["Com sugestões", dados.alunos_com_recomendacoes],
    ["Já escolheram curso", dados.alunos_que_escolheram_curso],
    ["Com alerta de viés", dados.alunos_com_alertas_de_vies],
  ];

  return (
    <EcraProvisorio titulo="Painel" largo>
      <dl className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {numeros.map(([rotulo, valor]) => (
          <div key={rotulo} className="rounded border bg-white p-3">
            <dt className="text-xs text-slate-500">{rotulo}</dt>
            <dd className="text-2xl font-semibold tabular-nums">{valor}</dd>
          </div>
        ))}
      </dl>
      <h2 className="mb-2 font-semibold">Perfis dominantes</h2>
      <ul className="mb-8 text-sm">
        {Object.entries(dados.distribuicao_perfis).map(([perfil, n]) => <li key={perfil}>{perfil}: {n}</li>)}
      </ul>
      <h2 className="mb-2 font-semibold">Cursos mais sugeridos em 1.º lugar</h2>
      <ul className="text-sm">
        {dados.cursos_mais_recomendados.map((c) => <li key={c.curso + c.instituicao}>{c.curso} ({c.instituicao}): {c.alunos}</li>)}
      </ul>
    </EcraProvisorio>
  );
}
