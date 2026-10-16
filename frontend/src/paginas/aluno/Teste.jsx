import { useNavigate } from "react-router-dom";

import { ACarregar, Botao, EcraProvisorio, MensagemErro } from "../../componentes/base";
import { useTeste } from "../../hooks/useTeste";
import { sessaoAluno } from "../../sessao/sessaoAluno";

export default function Teste() {
  const navegar = useNavigate();
  const { alunoId } = sessaoAluno();
  const { estado, carregando, aEnviar, erro, responder, repetir, recarregar } = useTeste(alunoId);

  if (carregando) return <EcraProvisorio titulo="Perguntas"><ACarregar /></EcraProvisorio>;

  if (!estado) {
    return (
      <EcraProvisorio titulo="Perguntas">
        <MensagemErro erro={erro} />
        <Botao onClick={recarregar}>Tentar de novo</Botao>
      </EcraProvisorio>
    );
  }

  if (estado.terminado) {
    return (
      <EcraProvisorio titulo="Terminaste as perguntas">
        {estado.pode_repetir ? (
          <>
            <p className="mb-4 text-slate-700">
              Algumas respostas foram muito rápidas ou parecidas entre si. Se quiseres, podes responder outra vez
              com mais calma. Só dá para repetir uma vez.
            </p>
            <MensagemErro erro={erro} />
            <div className="flex flex-wrap gap-3">
              <Botao onClick={repetir} disabled={aEnviar}>Repetir o teste</Botao>
              <Botao variante="secundario" onClick={() => navegar("/aluno/resultado")}>Ver o resultado</Botao>
            </div>
          </>
        ) : (
          <Botao onClick={() => navegar("/aluno/resultado")}>Ver os cursos sugeridos</Botao>
        )}
      </EcraProvisorio>
    );
  }

  const { item } = estado;
  return (
    <EcraProvisorio titulo={`Pergunta ${estado.respondidas + 1}`}>
      {estado.tentativa > 1 && <p className="mb-2 text-xs text-slate-500">Segunda tentativa</p>}
      <p className="mb-6 text-lg text-slate-900">{item.texto}</p>
      <ul className="space-y-3">
        {item.opcoes.map((o) => (
          <li key={o.opcao}>
            <button
              type="button"
              disabled={aEnviar}
              onClick={() => responder(o)}
              className="w-full rounded border border-slate-300 px-4 py-3 text-left text-sm hover:border-slate-900 disabled:opacity-50"
            >
              <span className="mr-2 font-semibold">{o.posicao}.</span>{o.texto}
            </button>
          </li>
        ))}
      </ul>
      <MensagemErro erro={erro} />
    </EcraProvisorio>
  );
}
