// Termos de utilização e política de privacidade (texto simples, para alunos,
// famílias e orientadores). Descreve só o que o sistema faz de facto.

import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const SECCOES = [
  [
    "O que é o Njango Edu",
    "O Njango Edu é um sistema de apoio à orientação vocacional para estudantes finalistas do I Ciclo do Ensino Secundário, desenvolvido como Trabalho de Fim de Curso no IMETRO. As sugestões de cursos são uma ajuda à decisão: não substituem a conversa com a família e com a escola, nem as regras de acesso de cada instituição.",
  ],
  [
    "Que dados guardamos",
    "Do aluno: nome, idade, escola, as 12 notas finais, as respostas ao teste (incluindo o tempo que levou a responder) e as sugestões de cursos, com o curso escolhido. Do orientador: nome, e-mail, escola ou instituição e a palavra-passe, que é guardada cifrada (ninguém a consegue ler).",
  ],
  [
    "Para que usamos os dados",
    "Só para calcular as sugestões de cursos e para o orientador acompanhar os alunos. Os dados não são vendidos nem partilhados com outras entidades, e o sistema não usa publicidade nem ferramentas de seguimento.",
  ],
  [
    "Quem pode ver os dados",
    "O aluno vê os seus próprios resultados durante 24 horas no dispositivo onde fez o teste. Os orientadores com conta aprovada por um administrador vêem os dados dos alunos para os poderem acompanhar. Uma conta de orientador só funciona depois de aprovada.",
  ],
  [
    "Responsabilidades do orientador",
    "O orientador compromete-se a usar os dados dos alunos apenas para orientação vocacional, a não os divulgar e a manter a sua palavra-passe em segredo. As contas podem ser desactivadas se forem usadas para outros fins.",
  ],
  [
    "Os seus direitos",
    "Pode pedir para ver, corrigir ou apagar os seus dados junto do orientador da escola ou do responsável pelo projecto. Tratamos os dados pessoais com respeito pela Lei n.º 22/11, de 17 de Junho (Lei da Protecção de Dados Pessoais de Angola).",
  ],
];

export default function Privacidade() {
  return (
    <div className="min-h-screen bg-fundo">
      <main className="mx-auto max-w-[760px] px-4 py-10 sm:px-6 md:py-16">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-[15px] font-semibold text-primaria">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Página inicial
        </Link>
        <h1 className="mb-2 text-[30px] font-bold leading-tight md:text-[36px]">Termos de utilização e privacidade</h1>
        <p className="mb-10 text-[16px] text-texto-suave">Explicamos de forma simples que dados o Njango Edu guarda e para quê.</p>
        <div className="flex flex-col gap-5">
          {SECCOES.map(([titulo, texto]) => (
            <section key={titulo} className="rounded-[14px] border-[1.5px] border-borda bg-white p-6">
              <h2 className="mb-2 text-[18px] font-bold">{titulo}</h2>
              <p className="text-[15px] leading-relaxed text-texto-suave">{texto}</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
