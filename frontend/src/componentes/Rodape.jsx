import Marca from "./Marca";

// Computador: logótipo e descrição numa só linha, centrados na vertical; à direita, o projecto e o ano.
// Telemóvel: tudo em coluna, centrado.
export default function Rodape() {
  return (
    <footer className="w-full border-t border-borda bg-white py-5">
      <div className="mx-auto flex max-w-[1140px] flex-col items-center justify-between gap-3 px-4 text-center sm:px-6 xl:flex-row xl:gap-8 xl:text-left">
        <div className="flex flex-col items-center gap-2 xl:flex-row xl:gap-4">
          <Marca className="h-7 shrink-0" />
          <span className="hidden h-6 w-px bg-texto-suave/30 xl:block" aria-hidden="true" />
          <p className="text-[14px] font-medium leading-snug text-texto-suave xl:whitespace-nowrap xl:leading-none">
            Sistema de orientação vocacional para finalistas do I Ciclo · Luanda
          </p>
        </div>
        <p className="text-[14px] font-medium leading-snug text-texto-suave xl:whitespace-nowrap xl:leading-none">
          Projecto de Fim de Curso · IMETRO · © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
