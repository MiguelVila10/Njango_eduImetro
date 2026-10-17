// Cabeçalho do lado do aluno: logótipo, "Área do orientador" e botão Começar.
// No telemóvel, as ligações ficam num menu que abre por cima do conteúdo.

import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { sessaoAluno } from "../sessao/sessaoAluno";

export function Logotipo({ className = "" }) {
  return (
    <Link to="/" className={`flex items-center text-[24px] font-extrabold tracking-tight text-texto md:text-[26px] ${className}`}>
      <span>Njango</span>
      <span className="text-primaria">Edu</span>
    </Link>
  );
}

/** Para onde leva o botão principal: continua o teste se já houver sessão. */
export function destinoComecar() {
  const sessao = sessaoAluno();
  return sessao
    ? { para: "/aluno/notas", texto: "Continuar o teste" }
    : { para: "/registo", texto: "Começar" };
}

export default function Cabecalho() {
  const [menuAberto, setMenuAberto] = useState(false);
  const { para, texto } = destinoComecar();

  useEffect(() => {
    if (!menuAberto) return undefined;
    const fecharComEsc = (e) => e.key === "Escape" && setMenuAberto(false);
    window.addEventListener("keydown", fecharComEsc);
    return () => window.removeEventListener("keydown", fecharComEsc);
  }, [menuAberto]);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-borda bg-white">
      <div className="mx-auto flex h-[72px] max-w-[1140px] items-center justify-between px-4 sm:px-6 md:h-[80px]">
        <Logotipo />

        <nav className="hidden items-center gap-6 md:flex" aria-label="Principal">
          <Link to="/orientador/entrar" className="inline-flex min-h-[44px] items-center px-2 text-[16px] font-medium text-texto-suave transition-colors hover:text-primaria">
            Área do orientador
          </Link>
          <Link to={para} className="inline-flex h-12 items-center rounded-md bg-primaria px-6 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-primaria-escura focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria focus-visible:ring-offset-2">
            {texto}
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setMenuAberto((v) => !v)}
          aria-expanded={menuAberto}
          aria-controls="menu-telemovel"
          aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-2 text-texto transition-colors hover:bg-fundo hover:text-primaria focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria md:hidden"
        >
          {menuAberto ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
        </button>
      </div>

      <AnimatePresence>
        {menuAberto && (
          <motion.div
            id="menu-telemovel"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute inset-x-0 top-full border-t border-borda bg-white px-4 py-6 shadow-xl sm:px-6 md:hidden"
          >
            <nav className="flex flex-col gap-4" aria-label="Menu">
              <Link to="/orientador/entrar" onClick={() => setMenuAberto(false)} className="flex min-h-[44px] items-center border-b border-borda py-2 text-[16px] font-medium text-texto hover:text-primaria">
                Área do orientador
              </Link>
              <Link to={para} onClick={() => setMenuAberto(false)} className="flex h-[52px] w-full items-center justify-center rounded-md bg-primaria text-[16px] font-bold text-white shadow-sm hover:bg-primaria-escura">
                {texto}
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
