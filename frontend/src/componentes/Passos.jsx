// Indicador dos 4 passos do percurso do aluno.

const PASSOS = ["Os teus dados", "Notas", "Teste", "Sugestões"];

export default function Passos({ atual }) {
  return (
    <ol className="flex flex-wrap gap-1.5 text-[13px] font-semibold text-texto-suave" aria-label="Passos">
      {PASSOS.map((nome, i) => {
        const numero = i + 1;
        const ativo = numero === atual;
        const feito = numero < atual;
        return (
          <li
            key={nome}
            aria-current={ativo ? "step" : undefined}
            className={`rounded-full px-2.5 py-1 ${ativo ? "bg-primaria-clara text-primaria-escura" : feito ? "bg-fundo text-primaria" : "bg-fundo"}`}
          >
            {numero} {nome}
          </li>
        );
      })}
    </ol>
  );
}
