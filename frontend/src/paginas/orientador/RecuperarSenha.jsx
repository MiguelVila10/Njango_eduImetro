// "Esqueci-me da palavra-passe": o orientador escreve o e-mail e recebe um
// link para criar uma palavra-passe nova. A resposta é sempre a mesma, exista
// ou não uma conta com esse e-mail (não se revela quem tem conta).

import { ArrowLeft, LoaderCircle, Mail, MailCheck } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";

import { pedirRecuperacao } from "../../api/orientador";
import LayoutAcesso, { CampoComIcone } from "../../componentes/orientador/LayoutAcesso";
import { sessaoOrientador } from "../../sessao/sessaoOrientador";

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function RecuperarSenha() {
  const { state } = useLocation();
  const [email, setEmail] = useState(state?.email ?? "");
  const [erro, setErro] = useState(null);
  const [aEnviar, setAEnviar] = useState(false);
  const [enviado, setEnviado] = useState(false);

  if (sessaoOrientador()) return <Navigate to="/orientador" replace />;

  async function submeter(e) {
    e.preventDefault();
    if (!EMAIL_VALIDO.test(email.trim())) {
      setErro("Escreva o e-mail com que criou a conta.");
      document.getElementById("email")?.focus();
      return;
    }
    setAEnviar(true);
    setErro(null);
    try {
      await pedirRecuperacao(email.trim());
      setEnviado(true);
    } catch (err) {
      setErro(err.status === 400 ? "Este e-mail não parece válido." : err.message);
    } finally {
      setAEnviar(false);
    }
  }

  return (
    <LayoutAcesso>
      <Link to="/orientador/entrar" className="mb-8 inline-flex items-center gap-2 text-[15px] font-semibold text-primaria">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar a entrar
      </Link>

      {enviado ? (
        <div role="status">
          <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primaria-clara text-primaria">
            <MailCheck className="h-8 w-8" aria-hidden="true" />
          </span>
          <h1 className="mb-3 text-[32px] font-bold leading-tight">Veja o seu e-mail</h1>
          <p className="mb-4 text-[16px] leading-relaxed text-texto-suave">
            Se existir uma conta de orientador com <strong className="font-semibold text-texto">{email.trim()}</strong>,
            enviámos um link para criar uma palavra-passe nova. O link vale 1 hora e só pode ser usado uma vez.
          </p>
          <p className="mb-8 text-[15px] leading-relaxed text-texto-suave">
            Não recebeu? Veja também a pasta de spam. Se mesmo assim não chegar, peça ao administrador do sistema para
            lhe definir uma palavra-passe nova.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/orientador/entrar"
              state={{ email: email.trim() }}
              className="flex h-12 items-center rounded-[8px] bg-primaria px-8 text-[16px] font-medium text-white hover:bg-primaria-escura"
            >
              Voltar a entrar
            </Link>
            <button
              type="button"
              onClick={() => setEnviado(false)}
              className="flex h-12 items-center rounded-[8px] border border-primaria px-6 text-[16px] font-medium text-primaria hover:bg-primaria-clara"
            >
              Usar outro e-mail
            </button>
          </div>
        </div>
      ) : (
        <>
          <h1 className="mb-3 text-[28px] font-bold leading-tight sm:text-[32px]">
            Recuperar a <span className="whitespace-nowrap">palavra-passe</span>
          </h1>
          <p className="mb-8 text-[16px] leading-relaxed text-texto-suave">
            Escreva o e-mail da sua conta. Vamos enviar-lhe um link para criar uma palavra-passe nova.
          </p>
          <form onSubmit={submeter} noValidate className="flex flex-col gap-6">
            <CampoComIcone
              id="email" rotulo="E-mail" icone={Mail} type="email" inputMode="email" autoComplete="email"
              placeholder="nome@exemplo.com" value={email} erro={erro}
              onChange={(e) => { setEmail(e.target.value); if (erro) setErro(null); }}
            />
            <button
              type="submit"
              disabled={aEnviar}
              className="flex h-12 items-center justify-center gap-2 rounded-[8px] bg-primaria text-[16px] font-medium text-white transition-colors hover:bg-primaria-escura disabled:opacity-70"
            >
              {aEnviar && <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />}
              {aEnviar ? "A enviar…" : "Enviar link"}
            </button>
          </form>
        </>
      )}
    </LayoutAcesso>
  );
}
