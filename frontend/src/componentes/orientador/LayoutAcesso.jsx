// Moldura das páginas de acesso do orientador (entrar e criar conta), segundo o
// design: painel azul à esquerda com o logótipo, "Área do orientador", o que
// o orientador pode fazer e a ilustração; formulário à direita. No telemóvel o painel fica numa faixa
// em cima, sem a ilustração.

import { BookOpenCheck, ChartColumn, Users } from "lucide-react";
import { Link } from "react-router-dom";

import ilustracao from "../../assets/orientador/orientador.svg";
import Marca from "../Marca";

export default function LayoutAcesso({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-white lg:flex-row">
      <aside className="relative flex shrink-0 flex-col overflow-hidden bg-[#17589b] px-6 py-6 text-white sm:px-10 lg:w-[512px] lg:px-14 lg:py-14">
        <Link to="/" aria-label="Njango Edu — página inicial" className="relative z-10 flex items-center self-start">
          <Marca branco className="h-10 lg:h-12" />
        </Link>
        <div className="relative z-10 mt-4 lg:mt-14">
          <p className="text-[22px] font-bold leading-tight lg:text-[34px]">Área do orientador</p>
          <span className="mt-3 hidden h-[3px] w-12 rounded-full bg-samakaka-amarelo lg:block" aria-hidden="true" />
          <p className="mt-5 hidden max-w-[36ch] text-[16px] leading-relaxed text-white/85 lg:block">
            Acompanhe os finalistas do I Ciclo da sua escola e ajude-os a escolher o curso técnico certo.
          </p>
          <ul className="mt-7 hidden flex-col gap-3.5 lg:flex">
            {[
              [Users, "Veja o estado de cada aluno no percurso"],
              [ChartColumn, "Perceba porque cada curso foi sugerido"],
              [BookOpenCheck, "Mantenha os cursos e as perguntas actualizados"],
            ].map(([Icone, texto]) => (
              <li key={texto} className="flex items-center gap-3 text-[15px] text-white/90">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/12 ring-1 ring-white/20">
                  <Icone className="h-[18px] w-[18px]" aria-hidden="true" />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>
        <img
          src={ilustracao}
          alt=""
          aria-hidden="true"
          className="relative z-10 mx-auto mt-auto hidden max-h-[40vh] w-full max-w-[340px] object-contain pt-8 lg:block"
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
