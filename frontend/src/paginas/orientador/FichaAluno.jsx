import { useParams } from "react-router-dom";

import { fichaAluno } from "../../api/orientador";
import { ACarregar, EcraProvisorio, MensagemErro } from "../../componentes/base";
import { useCarregar } from "../../hooks/useCarregar";
import { NOME_ESTADO } from "./Alunos";

const pct = (v) => `${Math.round(v * 100)}%`;

export default function FichaAluno() {
  const { id } = useParams();
  const { dados: a, erro, carregando } = useCarregar(() => fichaAluno(id), [id]);
  if (carregando) return <EcraProvisorio titulo="Aluno" largo><ACarregar /></EcraProvisorio>;
  if (erro) return <EcraProvisorio titulo="Aluno" largo><MensagemErro erro={erro} /></EcraProvisorio>;

  const alertas = [...(a.alertas_vieses?.sobrestimacao ?? []), ...(a.alertas_vieses?.subestimacao ?? [])];

  return (
    <EcraProvisorio titulo={a.nome} largo>
      <p className="mb-6 text-sm text-slate-600">
        {a.idade} anos · {a.escola} · {NOME_ESTADO[a.estado]} · perfil {a.perfil_dominante ?? "—"}
      </p>

      <h2 className="mb-2 font-semibold">Confiança nas respostas</h2>
      <p className="mb-1 text-sm">{a.confianca === "baixa" ? "Baixa" : a.confianca === "normal" ? "Normal" : "—"}</p>
      {a.motivos_confianca.length > 0 && (
        <ul className="mb-6 list-disc pl-5 text-sm text-slate-700">{a.motivos_confianca.map((m) => <li key={m}>{m}</li>)}</ul>
      )}

      {alertas.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 font-semibold">Alertas de viés</h2>
          <pre className="mb-6 overflow-x-auto rounded bg-white p-3 text-xs">{JSON.stringify(a.alertas_vieses, null, 2)}</pre>
        </>
      )}

      <h2 className="mb-2 mt-6 font-semibold">Sugestões</h2>
      <ol className="mb-6 space-y-1 text-sm">
        {a.sugestoes.map((s) => (
          <li key={s.rank}>
            {s.rank}.º {s.nome} ({s.instituicao}) · {pct(s.score_final)}{s.escolhida_pelo_aluno && " · escolhido"}
          </li>
        ))}
      </ol>

      <h2 className="mb-2 font-semibold">Notas</h2>
      <ul className="grid grid-cols-2 gap-1 text-sm sm:grid-cols-3">
        {Object.entries(a.notas).map(([d, n]) => <li key={d}>{d}: {n}</li>)}
      </ul>
    </EcraProvisorio>
  );
}
