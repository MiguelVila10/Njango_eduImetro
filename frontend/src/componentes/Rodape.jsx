import Marca from "./Marca";

export default function Rodape() {
  return (
    <footer className="w-full border-t border-borda bg-white py-5">
      <div className="mx-auto flex max-w-[1140px] flex-col items-center justify-between gap-2 px-4 md:gap-8 text-center sm:px-6 md:flex-row md:text-left">
        <div className="flex flex-col items-center gap-2 md:flex-row md:gap-3">
          <Marca className="h-7 shrink-0" />
          <p className="text-[14px] font-medium text-texto-suave">
            Sistema de orientação vocacional para estudantes finalistas do I Ciclo do Ensino Secundário, em Luanda
          </p>
        </div>
        <p className="shrink-0 whitespace-nowrap text-[14px] font-medium text-texto-suave">Projecto de Fim de Curso · IMETRO</p>
        <p className="shrink-0 whitespace-nowrap text-[14px] font-medium text-texto-suave">© {new Date().getFullYear()} Njango Edu</p>
      </div>
    </footer>
  );
}
