import { useNavigate } from "react-router-dom";

import { DISCIPLINAS } from "../../api/aluno";
import { ACarregar, Botao, Campo, EcraProvisorio, MensagemErro } from "../../componentes/base";
import { useNotas } from "../../hooks/useNotas";
import { sessaoAluno } from "../../sessao/sessaoAluno";

export default function Notas() {
  const navegar = useNavigate();
  const { alunoId } = sessaoAluno();
  const { notas, erros, definirNota, guardar, carregando, aGuardar, erro } = useNotas(alunoId);

  async function submeter(e) {
    e.preventDefault();
    if (await guardar()) navegar("/aluno/teste");
  }

  if (carregando) return <EcraProvisorio titulo="As tuas notas"><ACarregar /></EcraProvisorio>;

  return (
    <EcraProvisorio titulo="As tuas notas da 9.ª classe">
      <p className="mb-4 text-sm text-slate-600">Escreve a nota final de cada disciplina, de 10 a 20.</p>
      <form onSubmit={submeter} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {DISCIPLINAS.map((d, i) => (
          <Campo
            key={d}
            id={`nota-${i}`}
            rotulo={d}
            type="number"
            inputMode="numeric"
            min={10}
            max={20}
            value={notas[d]}
            onChange={(e) => definirNota(d, e.target.value)}
            erro={erros[d]}
          />
        ))}
        <div className="sm:col-span-2">
          <MensagemErro erro={erro} />
          <Botao type="submit" disabled={aGuardar}>{aGuardar ? "A guardar…" : "Continuar para as perguntas"}</Botao>
        </div>
      </form>
    </EcraProvisorio>
  );
}
