import Marca from "./Marca";

// Computador: 1.ª linha com o logótipo e a descrição lado a lado, centrados na vertical;
// 2.ª linha com o projecto (à esquerda) e o ano (à direita).
// Telemóvel: tudo em coluna, centrado.
export default function Rodape() {
  return (
    <footer className="w-full border-t border-borda bg-white py-5">
      <div className="mx-auto flex max-w-[1140px] flex-col gap-3 px-4 text-center sm:px-6 lg:text-left">
        <div className="flex flex-col items-center gap-2 lg:flex-row lg:gap-4">
          <Marca className="h-7 shrink-0" />
          <span className="hidden h-6 w-px bg-texto-suave/30 lg:block" aria-hidden="true" />
          <p className="text-[14px] font-medium leading-snug text-texto-suave lg:whitespace-nowrap lg:leading-none">
            Sistema de orientação vocacional para estudantes finalistas do I Ciclo do Ensino Secundário, em Luanda
          </p>
        </div>
        <div className="flex flex-col items-center gap-1 border-borda lg:flex-row lg:justify-between lg:border-t lg:pt-3">
          <p className="text-[14px] font-medium text-texto-suave">Projecto de Fim de Curso · IMETRO</p>
          <p className="text-[14px] font-medium text-texto-suave">© {new Date().getFullYear()} Njango Edu</p>
        </div>
      </div>
    </footer>
  );
}
