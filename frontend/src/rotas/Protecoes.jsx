// Rotas protegidas e reacção à sessão expirada.

import { useEffect } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";

import { EVENTO_SESSAO_EXPIRADA } from "../api/cliente";
import { sessaoAluno } from "../sessao/sessaoAluno";
import { sessaoOrientador } from "../sessao/sessaoOrientador";

/** Só entra quem tem sessão de aluno válida; sem ela, volta ao início. */
export function RotaAluno() {
  return sessaoAluno() ? <Outlet /> : <Navigate to="/" replace />;
}

/** Só entra o orientador com sessão iniciada; guarda para onde ia. */
export function RotaOrientador() {
  const local = useLocation();
  if (sessaoOrientador()) return <Outlet />;
  return <Navigate to="/orientador/entrar" replace state={{ voltarPara: local.pathname }} />;
}

/** Quando o servidor recusa a sessão (401), leva a pessoa ao sítio certo. */
export function OuvirSessaoExpirada() {
  const navegar = useNavigate();
  useEffect(() => {
    function aoExpirar(evento) {
      if (evento.detail?.tipo === "orientador") {
        navegar("/orientador/entrar", { replace: true, state: { expirou: true } });
      } else {
        navegar("/sessao-expirada", { replace: true });
      }
    }
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
    return () => window.removeEventListener(EVENTO_SESSAO_EXPIRADA, aoExpirar);
  }, [navegar]);
  return null;
}
