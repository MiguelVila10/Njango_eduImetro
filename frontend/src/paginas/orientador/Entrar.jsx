import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { entrar } from "../../api/orientador";
import { Botao, Campo, EcraProvisorio, MensagemErro } from "../../componentes/base";
import { iniciarSessaoOrientador, sessaoOrientador } from "../../sessao/sessaoOrientador";

export default function Entrar() {
  const navegar = useNavigate();
  const { state } = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState(null);
  const [aEnviar, setAEnviar] = useState(false);

  if (sessaoOrientador()) return <Navigate to="/orientador" replace />;

  async function submeter(e) {
    e.preventDefault();
    if (!username || !password) {
      setErro(new Error("Escreve o utilizador e a palavra-passe."));
      return;
    }
    setAEnviar(true);
    setErro(null);
    try {
      const { token } = await entrar(username, password);
      iniciarSessaoOrientador({ token, username });
      navegar(state?.voltarPara ?? "/orientador", { replace: true });
    } catch (err) {
      // O DRF responde 400 com credenciais erradas; não dizemos qual está errado.
      setErro(err.status === 400 ? new Error("Utilizador ou palavra-passe incorrectos.") : err);
    } finally {
      setAEnviar(false);
    }
  }

  return (
    <EcraProvisorio titulo="Entrar como orientador">
      {state?.expirou && <p className="mb-4 text-sm text-slate-600">A tua sessão terminou. Entra de novo.</p>}
      <form onSubmit={submeter} noValidate className="space-y-4">
        <Campo id="utilizador" rotulo="Utilizador" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        <Campo id="senha" rotulo="Palavra-passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        <MensagemErro erro={erro} />
        <Botao type="submit" disabled={aEnviar}>{aEnviar ? "A entrar…" : "Entrar"}</Botao>
      </form>
    </EcraProvisorio>
  );
}
