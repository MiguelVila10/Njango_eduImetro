import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { sessaoOrientador, terminarSessaoOrientador } from "../../sessao/sessaoOrientador";

const ligacoes = [
  ["/orientador", "Painel"],
  ["/orientador/alunos", "Alunos"],
  ["/orientador/cursos", "Cursos"],
  ["/orientador/perguntas", "Perguntas"],
];

export default function LayoutOrientador() {
  const navegar = useNavigate();
  const sessao = sessaoOrientador();

  function sair() {
    terminarSessaoOrientador();
    navegar("/orientador/entrar", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3 text-sm">
          {ligacoes.map(([para, texto]) => (
            <NavLink key={para} to={para} end className={({ isActive }) => (isActive ? "font-semibold" : "text-slate-600")}>
              {texto}
            </NavLink>
          ))}
          <span className="ml-auto text-slate-500">{sessao?.username}</span>
          <button type="button" onClick={sair} className="text-slate-600 underline">Sair</button>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}
