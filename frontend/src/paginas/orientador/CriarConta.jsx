// Pedido de conta de orientador (design "Cadastro — Área do orientador").
// A conta fica pendente até um administrador a aprovar; depois de enviar,
// o orientador volta à página de entrar com um aviso.

import { Building2, Eye, EyeOff, Lock, LoaderCircle, Mail, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { pedirConta } from "../../api/orientador";
import LayoutAcesso, { CampoComIcone } from "../../componentes/orientador/LayoutAcesso";
import { sessaoOrientador } from "../../sessao/sessaoOrientador";

// As mesmas regras do servidor (alunos/orientadores.py).
const NOME_VALIDO = /^\p{L}+(?:[ '’-]\p{L}+)*$/u;
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ESCOLA_VALIDA = /^[\p{L}\p{N}](?:[\p{L}\p{N}]|[ .,ºª°'’/()-])*$/u;
const letras = (v) => (v.match(/\p{L}/gu) ?? []).length;
const limpar = (v) => v.trim().replace(/\s+/g, " ");

function validar(c) {
  const e = {};
  const nome = limpar(c.nome);
  if (!nome) e.nome = "Indique o seu nome completo.";
  else if (!NOME_VALIDO.test(nome)) e.nome = "O nome só pode ter letras, espaços, hífen ou apóstrofo.";
  else if (nome.split(" ").length < 2) e.nome = "Indique o nome completo (nome e apelido).";

  if (!c.email.trim()) e.email = "Indique o seu e-mail.";
  else if (!EMAIL_VALIDO.test(c.email.trim())) e.email = "Este e-mail não parece válido.";

  const escola = limpar(c.escola);
  if (!escola) e.escola = "Indique a escola ou instituição onde trabalha.";
  else if (!ESCOLA_VALIDA.test(escola) || /[^\p{L}\p{N}\s]{3,}/u.test(escola) || letras(escola) < 3) {
    e.escola = "Indique o nome da escola ou instituição com letras.";
  }

  if (c.password.length < 8 || !/\p{L}/u.test(c.password) || !/\d/.test(c.password)) {
    e.password = "Use pelo menos 8 caracteres, com letras e números.";
  }
  if (!c.confirmar) e.confirmar = "Repita a palavra-passe.";
  else if (c.confirmar !== c.password) e.confirmar = "As palavras-passe não são iguais.";
  if (!c.termos) e.termos = "É preciso aceitar os termos e a política de privacidade.";
  return e;
}

// Nomes dos campos no servidor → nomes no formulário.
const CAMPO_DO_SERVIDOR = { confirmar_password: "confirmar", aceita_termos: "termos" };

export default function CriarConta() {
  const navegar = useNavigate();
  const [campos, setCampos] = useState({ nome: "", email: "", escola: "", password: "", confirmar: "", termos: false });
  const [erros, setErros] = useState({});
  const [tentou, setTentou] = useState(false);
  const [verSenha, setVerSenha] = useState(false);
  const [aEnviar, setAEnviar] = useState(false);
  const [erroGeral, setErroGeral] = useState(null);

  if (sessaoOrientador()) return <Navigate to="/orientador" replace />;

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
      const r = await pedirConta({
        nome: limpar(campos.nome), email: campos.email.trim(), escola: limpar(campos.escola),
        password: campos.password, confirmarPassword: campos.confirmar, aceitaTermos: campos.termos,
      });
      navegar("/orientador/entrar", { replace: true, state: { contaPedida: true, email: r.email } });
    } catch (err) {
      if (err.status === 400 && err.dados && typeof err.dados === "object") {
        const doServidor = {};
        for (const [campo, msgs] of Object.entries(err.dados)) {
          doServidor[CAMPO_DO_SERVIDOR[campo] ?? campo] = Array.isArray(msgs) ? msgs[0] : String(msgs);
        }
        setErros(doServidor);
      } else {
        setErroGeral(err.message);
      }
    } finally {
      setAEnviar(false);
    }
  }

  const botaoVer = (
    <button
      type="button"
      onClick={() => setVerSenha((v) => !v)}
      aria-label={verSenha ? "Esconder as palavras-passe" : "Mostrar as palavras-passe"}
      className="-mr-2 flex h-9 w-9 items-center justify-center rounded-full text-texto-suave hover:bg-fundo"
    >
      {verSenha ? <EyeOff className="h-[18px] w-[18px]" aria-hidden="true" /> : <Eye className="h-[18px] w-[18px]" aria-hidden="true" />}
    </button>
  );

  return (
    <LayoutAcesso>
      <h1 className="mb-3 text-[32px] font-bold leading-tight">Criar conta</h1>
      <p className="mb-8 text-[16px] leading-relaxed text-texto-suave">
        Registe-se como orientador para apoiar os finalistas do I Ciclo nas suas escolhas. A conta fica activa depois
        de ser aprovada por um administrador.
      </p>

      <form onSubmit={submeter} noValidate className="flex flex-col gap-6">
        <CampoComIcone
          id="nome" rotulo="Nome completo" icone={UserRound} autoComplete="name" placeholder="Indique o seu nome completo"
          value={campos.nome} onChange={(e) => mudar("nome", e.target.value)} erro={erros.nome}
        />
        <CampoComIcone
          id="email" rotulo="E-mail" icone={Mail} type="email" autoComplete="email" placeholder="nome@exemplo.com"
          value={campos.email} onChange={(e) => mudar("email", e.target.value)} erro={erros.email}
        />
        <CampoComIcone
          id="escola" rotulo="Escola ou instituição" icone={Building2} autoComplete="organization"
          placeholder="Indique a sua instituição" value={campos.escola} onChange={(e) => mudar("escola", e.target.value)}
          erro={erros.escola}
        />
        <div className="flex flex-col gap-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <CampoComIcone
              id="password" rotulo="Palavra-passe" icone={Lock} type={verSenha ? "text" : "password"}
              autoComplete="new-password" placeholder="Crie a palavra-passe" value={campos.password}
              onChange={(e) => mudar("password", e.target.value)} erro={erros.password} direita={botaoVer}
            />
            <CampoComIcone
              id="confirmar" rotulo="Confirmar palavra-passe" icone={Lock} type={verSenha ? "text" : "password"}
              autoComplete="new-password" placeholder="Repita a palavra-passe" value={campos.confirmar}
              onChange={(e) => mudar("confirmar", e.target.value)} erro={erros.confirmar}
            />
          </div>
          {!erros.password && !erros.confirmar && (
            <p className="text-[13px] text-texto-suave">Utilize pelo menos 8 caracteres, com letras e números.</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="termos" className="flex items-start gap-3 text-[14px] leading-relaxed text-texto-suave">
            <input
              id="termos" type="checkbox" checked={campos.termos} onChange={(e) => mudar("termos", e.target.checked)}
              aria-invalid={Boolean(erros.termos)} aria-describedby={erros.termos ? "termos-erro" : undefined}
              className="mt-1 h-5 w-5 shrink-0 rounded border-borda accent-primaria"
            />
            <span>
              Li e aceito os{" "}
              <Link to="/privacidade" target="_blank" className="font-medium text-primaria underline underline-offset-2">Termos de utilização</Link>{" "}
              e a{" "}
              <Link to="/privacidade" target="_blank" className="font-medium text-primaria underline underline-offset-2">Política de privacidade</Link>.
            </span>
          </label>
          {erros.termos && <p id="termos-erro" className="pl-8 text-[13px] font-medium text-red-700">{erros.termos}</p>}
        </div>

        {erroGeral && <p role="alert" className="rounded-[8px] bg-red-50 px-4 py-3 text-[14px] text-red-700">{erroGeral}</p>}

        <button
          type="submit"
          disabled={aEnviar}
          className="flex h-12 items-center justify-center gap-2 rounded-[8px] bg-primaria text-[16px] font-medium text-white transition-colors hover:bg-primaria-escura disabled:opacity-70"
        >
          {aEnviar && <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />}
          {aEnviar ? "A enviar…" : "Criar conta"}
        </button>
      </form>

      <div className="mt-8 flex items-center justify-between gap-4 border-t border-borda pt-6">
        <span className="text-[15px] text-texto-suave">Já tem conta?</span>
        <Link
          to="/orientador/entrar"
          className="flex h-12 items-center rounded-[8px] border border-primaria px-10 text-[16px] font-medium text-primaria transition-colors hover:bg-primaria-clara"
        >
          Entrar
        </Link>
      </div>
    </LayoutAcesso>
  );
}
