import { useState } from "react";

import { alterarPergunta, listarPerguntas } from "../../api/orientador";
import { ACarregar, EcraProvisorio, MensagemErro } from "../../componentes/base";
import { useCarregar } from "../../hooks/useCarregar";

export default function Perguntas() {
  const { dados, erro, carregando, recarregar } = useCarregar(listarPerguntas);
  const [erroAcao, setErroAcao] = useState(null);

  async function alternarAtiva(p) {
    setErroAcao(null);
    try {
      await alterarPergunta(p.id, { ativo: !p.ativo });
      await recarregar();
    } catch (e) {
      setErroAcao(e);
    }
  }

  if (carregando) return <EcraProvisorio titulo="Perguntas" largo><ACarregar /></EcraProvisorio>;
  if (erro) return <EcraProvisorio titulo="Perguntas" largo><MensagemErro erro={erro} /></EcraProvisorio>;

  return (
    <EcraProvisorio titulo="Banco de perguntas" largo>
      <p className="mb-4 text-sm text-slate-600">
        As perguntas não se apagam: desactivam-se. O formulário de adicionar pergunta entra com o ecrã do design.
      </p>
      <MensagemErro erro={erroAcao} />
      <ul className="space-y-3">
        {dados.map((p) => (
          <li key={p.id} className={`rounded border bg-white p-3 text-sm ${p.ativo ? "" : "opacity-60"}`}>
            <p className="mb-1">{p.codigo && <strong className="mr-2">{p.codigo}</strong>}{p.texto}</p>
            <p className="text-xs text-slate-500">
              {p.tipo} · {p.contexto || "sem contexto"} · resposta mais esperada: {p.tendencia} · {p.total_respostas} respostas
            </p>
            <button type="button" onClick={() => alternarAtiva(p)} className="mt-2 text-xs underline">
              {p.ativo ? "Desactivar" : "Activar"}
            </button>
          </li>
        ))}
      </ul>
    </EcraProvisorio>
  );
}
