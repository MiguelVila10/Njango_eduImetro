import { Link } from "react-router-dom";

import { EcraProvisorio } from "../../componentes/base";

export default function SessaoExpirada() {
  return (
    <EcraProvisorio titulo="O teu teste expirou">
      <p className="mb-6 text-slate-700">
        Cada teste fica aberto durante 24 horas. Esse tempo passou, por isso é preciso começar de novo.
      </p>
      <Link className="rounded bg-slate-900 px-4 py-2 text-sm text-white" to="/registo">Começar de novo</Link>
    </EcraProvisorio>
  );
}
