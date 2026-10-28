// Moldura da área do orientador (design "Njango Edu — Painel"): menu lateral
// fixo no computador, barra de topo com menu que abre no telemóvel.

import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpenCheck, FileQuestion, LayoutDashboard, LogOut, Menu, UserCheck, UserRound, Users, X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";

import { sairDaConta } from "../../api/orientador";
import { sessaoOrientador, terminarSessaoOrientador } from "../../sessao/sessaoOrientador";
import Marca from "../../componentes/Marca";

const LIGACOES = [
  { para: "/orientador", texto: "Painel", icone: LayoutDashboard, fim: true },
  { para: "/orientador/alunos", texto: "Alunos", icone: Users },
  { para: "/orientador/cursos", texto: "Cursos", icone: BookOpenCheck },
  { para: "/orientador/perguntas", texto: "Perguntas do teste", icone: FileQuestion },
];
const PEDIDOS = { para: "/orientador/pedidos", texto: "Pedidos de conta", icone: UserCheck };

function Logotipo() {
  return (
    <Link to="/orientador" aria-label="Njango Edu — painel" className="flex items-center">
      <Marca className="h-9 lg:h-10" />
    </Link>
  );
}

function Navegacao({ ligacoes, aoNavegar }) {
  return (
    <nav aria-label="Área do orientador" className="flex flex-col gap-1">
      {ligacoes.map(({ para, texto, icone: Icone, fim }) => (
        <NavLink
          key={para}
          to={para}
          end={fim}
          onClick={aoNavegar}
          className={({ isActive }) =>
            `flex h-12 items-center gap-3 rounded-[10px] px-4 text-[16px] font-medium transition-colors ${
              isActive ? "bg-primaria-clara font-semibold text-primaria" : "text-texto hover:bg-fundo"
            }`
          }
        >
          <Icone className="h-5 w-5 shrink-0" aria-hidden="true" />
          {texto}
        </NavLink>
      ))}
    </nav>
  );
}

function Conta({ sessao, aoSair }) {
  return (
    <div className="border-t border-borda px-5 py-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primaria-escura text-white">
          <UserRound className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold">{sessao?.nome ?? sessao?.username ?? "Orientador"}</p>
          <span className="inline-block rounded bg-primaria-clara px-1.5 py-0.5 text-[11px] font-medium text-primaria-escura">
            {sessao?.administrador ? "Administrador" : "Orientador"}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={aoSair}
        className="flex items-center gap-2 rounded-[8px] px-1 py-1 text-[14px] font-semibold text-red-700 hover:text-red-800"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" /> Sair
      </button>
    </div>
  );
}

export default function LayoutOrientador() {
  const navegar = useNavigate();
  const { pathname } = useLocation();
  const sessao = sessaoOrientador();
  const [menuAberto, setMenuAberto] = useState(false);
  const ligacoes = sessao?.administrador ? [...LIGACOES, PEDIDOS] : LIGACOES;

  useEffect(() => setMenuAberto(false), [pathname]);
  useEffect(() => {
    if (!menuAberto) return undefined;
    const fechar = (e) => e.key === "Escape" && setMenuAberto(false);
    document.addEventListener("keydown", fechar);
    return () => document.removeEventListener("keydown", fechar);
  }, [menuAberto]);

  async function sair() {
    // Apaga o token no servidor; sem ligação, termina pelo menos neste browser.
    try { await sairDaConta(); } catch { /* sem ligação: segue */ }
    terminarSessaoOrientador();
    navegar("/orientador/entrar", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-texto">
      {/* Menu lateral (computador) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] flex-col border-r border-borda bg-white lg:flex">
        <div className="px-7 pb-8 pt-7"><Logotipo /></div>
        <div className="flex-1 overflow-y-auto px-4"><Navegacao ligacoes={ligacoes} /></div>
        <Conta sessao={sessao} aoSair={sair} />
      </aside>

      {/* Menu no telemóvel */}
      <AnimatePresence>
        {menuAberto && (
          <motion.div
            className="fixed inset-0 z-40 bg-texto/40 lg:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setMenuAberto(false)}
          >
            <motion.aside
              role="dialog" aria-modal="true" aria-label="Menu"
              className="flex h-full w-[300px] max-w-[85vw] flex-col bg-white"
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 pb-6 pt-5">
                <Logotipo />
                <button
                  type="button" onClick={() => setMenuAberto(false)} aria-label="Fechar o menu"
                  className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-fundo"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-4"><Navegacao ligacoes={ligacoes} aoNavegar={() => setMenuAberto(false)} /></div>
              <Conta sessao={sessao} aoSair={sair} />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="lg:pl-[280px]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-borda bg-white/95 px-4 backdrop-blur sm:px-6 lg:h-[76px] lg:px-10">
          <button
            type="button" onClick={() => setMenuAberto(true)} aria-label="Abrir o menu"
            className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-fundo lg:hidden"
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <span className="lg:hidden"><Logotipo /></span>
          <p className="hidden text-[14px] text-texto-suave lg:block">Luanda · Ensino Secundário Geral &amp; Técnico-Profissional</p>
          <span
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-primaria-escura text-white"
            title={sessao?.nome ?? ""}
          >
            <UserRound className="h-5 w-5" aria-hidden="true" />
          </span>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
