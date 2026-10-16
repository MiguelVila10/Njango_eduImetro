import { Link } from "react-router-dom";

import { EcraProvisorio } from "../../componentes/base";
import { sessaoAluno } from "../../sessao/sessaoAluno";

export default function Inicio() {
  const sessao = sessaoAluno();
  return (
    <EcraProvisorio titulo="Bem-vindo ao Njango Edu">
      <p className="mb-6 text-slate-700">
        Vais escrever as notas da 9.ª classe e responder a algumas perguntas sobre situações do dia a dia.
        No fim, mostramos-te três cursos técnicos que combinam contigo.
      </p>
      <div className="flex flex-wrap gap-3">
        {sessao ? (
          <Link className="rounded bg-slate-900 px-4 py-2 text-sm text-white" to="/aluno/notas">
            Continuar, {sessao.nome}
          </Link>
        ) : (
          <Link className="rounded bg-slate-900 px-4 py-2 text-sm text-white" to="/registo">Começar</Link>
        )}
        <Link className="rounded border border-slate-300 px-4 py-2 text-sm" to="/orientador/entrar">
          Sou orientador
        </Link>
      </div>
    </EcraProvisorio>
  );
}
