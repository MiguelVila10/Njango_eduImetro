// Cabeçalho dos ecrãs do percurso do aluno (design Stitch/Figma das notas).
// Computador: logótipo, passos ao centro e o nome do aluno à direita.
// Telemóvel: botão voltar, logótipo e uma barra de 4 segmentos com o passo.

import { Check, ChevronLeft, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { sessaoAluno } from "../sessao/sessaoAluno";

export const PASSOS = ["Os teus dados", "Notas", "Teste", "Sugestões"];

export default function CabecalhoPercurso({ passo, voltarPara = "/", detalhe = null }) {
  const navegar = useNavigate();
  const sessao = sessaoAluno();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-borda bg-white">
      {/* Computador */}
      <div className="mx-auto hidden h-20 max-w-[1380px] items-center justify-between gap-6 px-6 md:flex lg:px-12">
        <Link to="/" className="shrink-0 text-[26px] font-extrabold tracking-tight">
          Njango<span className="text-primaria">Edu</span>
        </Link>

        <nav aria-label="Passos">
          <ol className="flex items-center gap-2">
            {PASSOS.map((nome, i) => {
              const n = i + 1;
              const feito = n < passo;
              const atual = n === passo;
              return (
                <li key={nome} className="flex items-center gap-2" aria-current={atual ? "step" : undefined}>
                  {i > 0 && <span aria-hidden="true" className="h-px w-8 bg-borda" />}
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-[12px] font-semibold ${
                      atual ? "bg-primaria text-white" : feito ? "bg-primaria-clara text-primaria" : "bg-fundo text-texto-suave"
                    }`}
                  >
                    {feito ? <Check className="h-4 w-4" aria-hidden="true" /> : n}
                  </span>
                  <span className={`text-[12px] font-semibold ${atual ? "text-primaria" : feito ? "text-texto" : "text-texto-suave"}`}>
                    {nome}
                    {feito && <span className="sr-only"> (concluído)</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          {sessao && (
            <div className="hidden text-right lg:block">
              <p className="text-[12px] font-semibold">{sessao.nome}</p>
              <p className="text-[12px] text-texto-suave">9.ª classe · Luanda</p>
            </div>
          )}
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primaria text-white" aria-hidden="true">
            <UserRound className="h-[18px] w-[18px]" />
          </span>
        </div>
      </div>

      {/* Telemóvel */}
      <div className="md:hidden">
        <div className="grid h-14 grid-cols-[44px_1fr_44px] items-center px-2">
          <button
            type="button"
            onClick={() => navegar(voltarPara)}
            aria-label="Voltar"
            className="flex h-11 w-11 items-center justify-center rounded-[14px] text-texto hover:bg-fundo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primaria"
          >
            <ChevronLeft className="h-6 w-6" aria-hidden="true" />
          </button>
          <Link to="/" className="text-center text-[20px] font-extrabold tracking-tight">
            Njango<span className="text-primaria">Edu</span>
          </Link>
          <span />
        </div>
        <div className="flex items-center gap-3 px-5 pb-3">
          <div className="grid flex-1 grid-cols-4 gap-1.5" aria-hidden="true">
            {PASSOS.map((nome, i) => (
              <span
                key={nome}
                className={`h-[5px] rounded-full ${i + 1 < passo ? "bg-emerald-700" : i + 1 === passo ? "bg-primaria" : "bg-borda"}`}
              />
            ))}
          </div>
          <span className="whitespace-nowrap text-[12px] font-bold text-primaria-escura">
            {passo} de 4 · {PASSOS[passo - 1]}
          </span>
        </div>
        {detalhe && <p className="-mt-1 px-5 pb-3 text-[13px] font-semibold text-texto-suave">{detalhe}</p>}
      </div>
    </header>
  );
}
