// Página aberta pelo link do e-mail: escolher a palavra-passe nova.
// Verifica logo se o link ainda vale (1 hora, uma só vez); se não, mostra
// como pedir outro. Depois de alterar, volta a "Entrar" com um aviso.

import { Eye, EyeOff, LinkIcon, LoaderCircle, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { definirNovaSenha, verificarLinkNovaSenha } from "../../api/orientador";
import LayoutAcesso, { CampoComIcone } from "../../componentes/orientador/LayoutAcesso";
import { terminarSessaoOrientador } from "../../sessao/sessaoOrientador";

function validar(c) {
  const e = {};
  if (c.password.length < 8 || !/\p{L}/u.test(c.password) || !/\d/.test(c.password)) {
    e.password = "Use pelo menos 8 caracteres, com letras e números.";
  }
  if (!c.confirmar) e.confirmar = "Repita a palavra-passe.";
  else if (c.confirmar !== c.password) e.confirmar = "As palavras-passe não são iguais.";
  return e;
}

function LinkInvalido() {
  return (
    <div role="alert">
      <span className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#fff4e0] text-[#9a5b00]">
        <LinkIcon className="h-8 w-8" aria-hidden="true" />
      </span>
      <h1 className="mb-3 text-[32px] font-bold leading-tight">Este link já não é válido</h1>
      <p className="mb-8 text-[16px] leading-relaxed text-texto-suave">
        O link para criar uma palavra-passe nova vale 1 hora e só pode ser usado uma vez. Peça um link novo.
      </p>
      <Link
        to="/orientador/recuperar-senha"
        className="inline-flex h-12 items-center rounded-[8px] bg-primaria px-8 text-[16px] font-medium text-white hover:bg-primaria-escura"
      >
        Pedir um link novo
      </Link>
    </div>
  );
}

export default function NovaSenha() {
  const navegar = useNavigate();
  const [params] = useSearchParams();
  const uid = params.get("uid") ?? "";
  const token = params.get("token") ?? "";

  const [estado, setEstado] = useState("a-verificar"); // a-verificar | valido | invalido
  const [email, setEmail] = useState("");
  const [campos, setCampos] = useState({ password: "", confirmar: "" });
  const [erros, setErros] = useState({});
  const [tentou, setTentou] = useState(false);
  const [verSenha, setVerSenha] = useState(false);
  const [aEnviar, setAEnviar] = useState(false);
  const [erroGeral, setErroGeral] = useState(null);

  useEffect(() => {
    let activo = true;
    if (!uid || !token) {
      setEstado("invalido");
      return undefined;
    }
    verificarLinkNovaSenha(uid, token)
      .then((r) => { if (activo) { setEmail(r.email ?? ""); setEstado("valido"); } })
      .catch((err) => {
        if (!activo) return;
        if (err.codigo === "link_invalido" || err.status === 400) setEstado("invalido");
        else { setEstado("valido"); setErroGeral(err.message); }
      });
    return () => { activo = false; };
  }, [uid, token]);

  function mudar(campo, valor) {
    const novos = { ...campos, [campo]: valor };
    setCampos(novos);
    if (tentou) setErros(validar(novos));
  }

  async function submeter(e) {
    e.preventDefault();
    setTentou(true);
    setErroGeral(null);
    const encontrados = validar(campos);
    setErros(encontrados);
    if (Object.keys(encontrados).length) {
      document.getElementById(Object.keys(encontrados)[0])?.focus();
      return;
    }
    setAEnviar(true);
    try {
      const r = await definirNovaSenha({ uid, token, password: campos.password, confirmarPassword: campos.confirmar });
      terminarSessaoOrientador();
      navegar("/orientador/entrar", { replace: true, state: { senhaAlterada: true, email: r.email ?? email } });
    } catch (err) {
      if (err.codigo === "link_invalido") setEstado("invalido");
      else if (err.status === 400 && err.dados && typeof err.dados === "object") {
        setErros({
          password: err.dados.password?.[0],
          confirmar: err.dados.confirmar_password?.[0],
        });
      } else setErroGeral(err.message);
    } finally {
      setAEnviar(false);
    }
  }

  const botaoVer = (
    <button
      type="button"
      onClick={() => setVerSenha((v) => !v)}
      aria-label={verSenha ? "Esconder as palavras-passe" : "Mostrar as palavras-passe"}
      className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full text-texto-suave hover:bg-fundo"
    >
      {verSenha ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
    </button>
  );

  return (
    <LayoutAcesso>
      {estado === "a-verificar" && (
        <div className="flex items-center gap-3 text-[16px] text-texto-suave" role="status">
          <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> A verificar o link…
        </div>
      )}

      {estado === "invalido" && <LinkInvalido />}

      {estado === "valido" && (
        <>
          <h1 className="mb-3 text-[32px] font-bold leading-tight">Criar palavra-passe nova</h1>
          <p className="mb-8 text-[16px] leading-relaxed text-texto-suave">
            {email ? <>Para a conta <strong className="font-semibold text-texto">{email}</strong>. </> : null}
            Escolha uma palavra-passe que não use noutros sítios.
          </p>
          <form onSubmit={submeter} noValidate className="flex flex-col gap-6">
            {/* Ajuda o gestor de palavras-passe do browser a guardar a nova para a conta certa. */}
            <input type="text" name="username" autoComplete="username" value={email} readOnly hidden />
            <CampoComIcone
              id="password" rotulo="Palavra-passe nova" icone={Lock} type={verSenha ? "text" : "password"}
              autoComplete="new-password" value={campos.password} onChange={(e) => mudar("password", e.target.value)}
              erro={erros.password} direita={botaoVer}
              ajuda="Utilize pelo menos 8 caracteres, com letras e números."
            />
            <CampoComIcone
              id="confirmar" rotulo="Confirmar palavra-passe nova" icone={Lock} type={verSenha ? "text" : "password"}
              autoComplete="new-password" value={campos.confirmar} onChange={(e) => mudar("confirmar", e.target.value)}
              erro={erros.confirmar}
            />
            {erroGeral && <p role="alert" className="rounded-[8px] bg-red-50 px-4 py-3 text-[14px] text-red-700">{erroGeral}</p>}
            <button
              type="submit"
              disabled={aEnviar}
              className="flex h-12 items-center justify-center gap-2 rounded-[8px] bg-primaria text-[16px] font-medium text-white transition-colors hover:bg-primaria-escura disabled:opacity-70"
            >
              {aEnviar && <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />}
              {aEnviar ? "A guardar…" : "Guardar palavra-passe nova"}
            </button>
          </form>
        </>
      )}
    </LayoutAcesso>
  );
}
