// Aparece quando a sessão do aluno expira (o token dura 24 horas) ou deixa de
// ser válida. Inspirado no aviso "A tua sessão terminou" do design Figma.

import { Clock, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";

export default function SessaoExpirada() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-fundo px-4 py-10">
      <div className="w-full max-w-[480px] rounded-[20px] border-[1.5px] border-borda bg-white p-8 text-center shadow-[0_12px_32px_rgba(37,43,66,0.08)] md:p-10">
        <span className="mx-auto mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-primaria-clara text-primaria">
          <Clock className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="mb-3 text-[26px] font-bold leading-tight">A tua sessão terminou</h1>
        <p className="mb-8 text-[16px] leading-relaxed text-texto-suave">
          Cada teste fica aberto durante 24 horas. Esse tempo passou, por isso é preciso fazer o registo de novo.
        </p>
        <Link
          to="/registo"
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[10px] bg-primaria text-[16px] font-semibold text-white transition-colors hover:bg-primaria-escura"
        >
          <RotateCcw className="h-[18px] w-[18px]" aria-hidden="true" /> Começar de novo
        </Link>
        <Link to="/" className="mt-4 inline-block text-[14px] font-semibold text-primaria hover:underline">
          Voltar à página inicial
        </Link>
      </div>
    </main>
  );
}
