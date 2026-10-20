export default function Rodape() {
  return (
    <footer className="w-full border-t border-borda bg-white py-5">
      <div className="mx-auto flex max-w-[1140px] flex-col items-center justify-between gap-2 px-4 text-center sm:px-6 md:flex-row md:text-left">
        <p className="text-[15px] font-semibold">
          <span className="font-extrabold">Njango</span>
          <span className="font-extrabold text-primaria">Edu</span>
          <span className="font-medium text-texto-suave"> — Sistema de orientação vocacional para estudantes finalistas do I Ciclo do Ensino Secundário, em Luanda</span>
        </p>
        <p className="text-[14px] font-medium text-texto-suave">Projecto de Fim de Curso · IMETRO</p>
        <p className="text-[14px] font-medium text-texto-suave">© {new Date().getFullYear()} Njango Edu</p>
      </div>
    </footer>
  );
}
