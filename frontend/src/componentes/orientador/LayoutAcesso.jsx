// Moldura das páginas de acesso do orientador (entrar e criar conta), segundo o
// design: painel azul à esquerda com o logótipo e "Área do orientador",
// ilustração e formulário à direita. No telemóvel o painel fica numa faixa
// em cima, sem a ilustração.

import { BookOpen, GraduationCap } from "lucide-react";
import { Link } from "react-router-dom";

import ilustracao from "../../assets/orientador/orientador.svg";

export default function LayoutAcesso({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-white lg:flex-row">
      <aside className="relative flex shrink-0 flex-col overflow-hidden bg-[#17589b] px-6 py-6 text-white sm:px-10 lg:w-[512px] lg:px-14 lg:py-14">
        <Link to="/" className="relative z-10 flex items-center gap-3 text-[24px] font-bold lg:text-[28px]">
          <BookOpen className="h-7 w-7" strokeWidth={1.8} aria-hidden="true" /> NjangoEdu
        </Link>
        <div className="relative z-10 mt-6 flex items-center gap-4 lg:mb-0 lg:mt-auto lg:block">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primaria lg:mb-8 lg:h-[88px] lg:w-[88px]">
            <GraduationCap className="h-6 w-6 lg:h-9 lg:w-9" strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div>
            <p className="text-[22px] font-bold leading-tight lg:text-[32px]">Área do orientador</p>
            <span className="mt-3 hidden h-[3px] w-12 rounded-full bg-white lg:block" aria-hidden="true" />
          </div>
        </div>
        <img
          src={ilustracao}
          alt=""
          aria-hidden="true"
          className="relative z-10 mx-auto mt-6 hidden max-h-[42vh] w-full max-w-[320px] object-contain lg:block"
        />
        {/* círculos decorativos do design */}
        <span aria-hidden="true" className="absolute -bottom-40 -right-24 hidden h-[360px] w-[360px] rounded-full border border-white/15 lg:block" />
        <span aria-hidden="true" className="absolute -bottom-52 -right-12 hidden h-[360px] w-[360px] rounded-full border border-white/10 lg:block" />
      </aside>
      <main className="flex flex-1 items-start justify-center px-4 py-8 sm:px-8 lg:items-center lg:py-14">
        <div className="w-full max-w-[504px]">{children}</div>
      </main>
    </div>
  );
}

/** Campo com ícone à esquerda (e conteúdo opcional à direita, como "mostrar"). */
export function CampoComIcone({ id, rotulo, icone: Icone, erro, direita = null, ajuda = null, ...props }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-[15px] font-medium">{rotulo}</label>
      <div
        className={`flex h-14 items-center gap-3 rounded-[8px] border bg-white px-4 transition-[border-color,box-shadow] focus-within:ring-4 ${
          erro ? "border-red-600 focus-within:ring-red-50" : "border-borda focus-within:border-primaria focus-within:ring-primaria/15"
        }`}
      >
        <Icone className="h-5 w-5 shrink-0 text-texto-suave" aria-hidden="true" />
        <input
          id={id}
          aria-invalid={Boolean(erro)}
          aria-describedby={erro ? `${id}-erro` : ajuda ? `${id}-ajuda` : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-texto-suave/80"
          {...props}
        />
        {direita}
      </div>
      {erro ? (
        <p id={`${id}-erro`} className="text-[13px] font-medium text-red-700">{erro}</p>
      ) : (
        ajuda && <p id={`${id}-ajuda`} className="text-[13px] text-texto-suave">{ajuda}</p>
      )}
    </div>
  );
}
