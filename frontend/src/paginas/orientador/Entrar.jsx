// Entrar na área do orientador (design "Área do orientador", painel azul).
// Entra com e-mail e palavra-passe. Avisos: sessão terminada, conta pendente
// (pedido ainda não aprovado) e conta acabada de pedir.

import { CircleCheck, Clock, Eye, EyeOff, Hourglass, Lock, LoaderCircle, Mail, MailCheck } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";

import { entrar } from "../../api/orientador";
import LayoutAcesso, { CampoComIcone } from "../../componentes/orientador/LayoutAcesso";
import { iniciarSessaoOrientador, sessaoOrientador } from "../../sessao/sessaoOrientador";

function Aviso({ icone: Icone, cor = "ambar", children }) {
  const cores = {
    ambar: "bg-[#fff4e0] text-[#9a5b00]",
    azul: "bg-primaria-clara text-primaria-escura",
    verde: "bg-emerald-50 text-emerald-800",
  };
  return (
    <div role="status" className={`mb-8 flex items-center gap-5 rounded-[12px] p-5 ${cores[cor]}`}>
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white">
        <Icone className="h-7 w-7" aria-hidden="true" />
      </span>
      <p className="text-[15px] leading-relaxed">{children}</p>
    </div>
  );
}

export default function Entrar() {
  const navegar = useNavigate();
  const { state } = useLocation();
  const [email, setEmail] = useState(state?.email ?? "");
  const [password, setPassword] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState(null);
  const [pendente, setPendente] = useState(false);
  const [aEnviar, setAEnviar] = useState(false);

  if (sessaoOrientador()) return <Navigate to="/orientador" replace />;

  async function submeter(e) {
    e.preventDefault();
    setPendente(false);
    if (!email.trim() || !password) {
      setErro("Escreva o e-mail e a palavra-passe.");
      return;
    }
    setAEnviar(true);
    setErro(null);
    try {
      const r = await entrar(email.trim(), password);
      iniciarSessaoOrientador({ token: r.token, nome: r.nome, email: r.email || email.trim(), administrador: r.administrador });
      navegar(state?.voltarPara ?? "/orientador", { replace: true });
    } catch (err) {
      if (err.codigo === "conta_pendente") setPendente(true);
      else setErro(err.status === 400 ? "E-mail ou palavra-passe incorrectos." : err.message);
    } finally {
      setAEnviar(false);
    }
  }

  return (
    <LayoutAcesso>
      {state?.expirou && (
        <Aviso icone={Clock}>A sua sessão terminou. Entre novamente para continuar.</Aviso>
      )}
      {state?.contaPedida && !pendente && (
        <Aviso icone={MailCheck} cor="azul">
          Pedido de conta enviado. Vai poder entrar assim que um administrador aprovar a sua conta.
        </Aviso>
      )}
      {state?.senhaAlterada && (
        <Aviso icone={CircleCheck} cor="verde">Palavra-passe alterada. Entre com a palavra-passe nova.</Aviso>
      )}
      {pendente && (
        <Aviso icone={Hourglass}>
          A sua conta ainda aguarda aprovação de um administrador. Tente novamente mais tarde.
        </Aviso>
      )}

      <h1 className="mb-8 text-[32px] font-bold leading-tight">Entrar</h1>
      <form onSubmit={submeter} noValidate className="flex flex-col gap-6">
        <CampoComIcone
          id="email" rotulo="E-mail" icone={Mail} type="text" inputMode="email" autoComplete="username"
          value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@exemplo.com"
        />
        <CampoComIcone
          id="senha" rotulo="Palavra-passe" icone={Lock} type={verSenha ? "text" : "password"} autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)}
          direita={
            <button
              type="button"
              onClick={() => setVerSenha((v) => !v)}
              aria-label={verSenha ? "Esconder a palavra-passe" : "Mostrar a palavra-passe"}
              className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full text-texto-suave hover:bg-fundo"
            >
              {verSenha ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
            </button>
          }
        />
        <Link
          to="/orientador/recuperar-senha"
          state={{ email: email.trim() }}
          className="-mt-3 self-end text-[14px] font-medium text-primaria underline-offset-2 hover:underline"
        >
          Esqueci-me da palavra-passe
        </Link>
        {erro && <p role="alert" className="rounded-[8px] bg-red-50 px-4 py-3 text-[14px] text-red-700">{erro}</p>}
        <button
          type="submit"
          disabled={aEnviar}
          className="flex h-12 items-center justify-center gap-2 rounded-[8px] bg-primaria text-[16px] font-medium text-white transition-colors hover:bg-primaria-escura disabled:opacity-70"
        >
          {aEnviar && <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />}
          {aEnviar ? "A entrar…" : "Entrar"}
        </button>
      </form>

      <div className="mt-8 flex items-center justify-between gap-4 border-t border-borda pt-6">
        <span className="text-[15px] text-texto-suave">Ainda não tem conta?</span>
        <Link
          to="/orientador/criar-conta"
          className="flex h-12 items-center rounded-[8px] border border-primaria px-8 text-[16px] font-medium text-primaria transition-colors hover:bg-primaria-clara"
        >
          Criar conta
        </Link>
      </div>
    </LayoutAcesso>
  );
}
