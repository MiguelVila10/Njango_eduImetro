import Marca from "./Marca";

// Telemóvel: coluna centrada. Tablet e computador: uma linha (logótipo + descrição, projecto, ano).
// Em ecrãs largos (1360 px ou mais) a descrição cabe numa só linha, ao lado do logótipo;
// em ecrãs mais estreitos parte em duas linhas, centradas com o logótipo.
export default function Rodape() {
  return (
    <footer className="w-full border-t border-borda bg-white py-5">
      <div className="mx-auto flex max-w-[1140px] flex-col items-center justify-between gap-2 px-4 text-center sm:px-6 md:flex-row md:gap-8 md:text-left min-[1360px]:max-w-[1320px] min-[1360px]:gap-6">
        <div className="flex flex-col items-center gap-2 md:flex-row md:gap-3">
          <Marca className="h-7 shrink-0" />
          <p className="text-[14px] font-medium text-texto-suave min-[1360px]:whitespace-nowrap min-[1360px]:text-[13px]">
            Sistema de orientação vocacional para estudantes finalistas do I Ciclo do Ensino Secundário, em Luanda
          </p>
        </div>
        <p className="shrink-0 whitespace-nowrap text-[14px] font-medium text-texto-suave min-[1360px]:text-[13px]">Projecto de Fim de Curso · IMETRO</p>
        <p className="shrink-0 whitespace-nowrap text-[14px] font-medium text-texto-suave min-[1360px]:text-[13px]">© {new Date().getFullYear()} Njango Edu</p>
      </div>
    </footer>
  );
}
