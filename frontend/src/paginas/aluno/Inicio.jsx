// Página inicial do aluno (design do AI Studio, adaptado ao projecto).

import { AnimatePresence, motion } from "framer-motion";
import {
  Calculator, CheckCircle, ChevronDown, Compass, Crosshair, FileSpreadsheet,
  Heart, HelpCircle, Lightbulb, Palette, Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { pedido } from "../../api/cliente";
import heroGrande from "../../assets/hero-alunos.webp";
import heroPequena from "../../assets/hero-alunos-768.webp";
import Cabecalho, { destinoComecar } from "../../componentes/Cabecalho";
import FaixaSamakaka from "../../componentes/FaixaSamakaka";
import Rodape from "../../componentes/Rodape";

const PASSOS = [
  { icone: FileSpreadsheet, titulo: "Indica as tuas notas",
    texto: "Escreve as notas finais das 12 disciplinas da 9.ª classe. Elas mostram em que áreas tens mais facilidade." },
  { icone: HelpCircle, titulo: "Responde ao teste",
    texto: "Escolhe o que farias em várias situações do dia-a-dia. As perguntas mudam conforme as tuas respostas." },
  { icone: Compass, titulo: "Descobre os teus cursos",
    texto: "Recebes três cursos técnicos que combinam contigo. Para cada um, explicamos porquê." },
];

const PERFIS = [
  { nome: "Analítico", icone: Calculator, fundo: "bg-primaria-clara", cor: "text-primaria",
    texto: "Gostas de números, de experiências e de perceber como as coisas funcionam." },
  { nome: "Humanista", icone: Heart, fundo: "bg-humanista-claro", cor: "text-humanista",
    texto: "Gostas de ajudar, de ouvir os outros e de cuidar das pessoas." },
  { nome: "Criativo", icone: Palette, destaque: true,
    texto: "Gostas de desenhar, de criar e de dar forma às tuas ideias." },
  { nome: "Estrategista", icone: Crosshair, fundo: "bg-estrategista-claro", cor: "text-estrategista",
    texto: "Gostas de organizar, de planear e de liderar um grupo." },
];

const AVISOS = [
  { icone: CheckCircle, titulo: "Não há respostas erradas",
    texto: "No teste, escolhe a opção que mais se parece contigo, e não a que achas mais correcta." },
  { icone: Lightbulb, titulo: "É uma sugestão",
    texto: "O resultado ajuda-te a pensar. A decisão final é sempre tua." },
  { icone: Users, titulo: "Fala com quem te conhece",
    texto: "Mostra as sugestões à tua família e aos teus professores, e conversem juntos." },
];

const ESCOLAS = [
  ["ITEL", "Telecomunicações e Informática"],
  ["IPIL", "Indústria"],
  ["IMEL", "Economia e Gestão"],
  ["IMS", "Saúde"],
  ["CEARTE", "Arte"],
];

const PERGUNTAS = [
  ["Quanto tempo demora?",
    "Alguns minutos. O teste termina quando já tem informação suficiente sobre o teu perfil."],
  ["Preciso de criar conta?",
    "Não. Só pedimos o teu nome, a tua idade e a tua escola."],
  ["Quem vê os meus resultados?",
    "Tu e o orientador que acompanha os alunos. Os teus dados servem apenas para gerar as sugestões."],
  ["E se não concordar com as sugestões?",
    "Não faz mal. As sugestões são um ponto de partida para conversares com a tua família e os teus professores."],
];

/** Número de cursos e de escolas no catálogo; se a API falhar, fica o texto do design. */
function useCatalogo() {
  const [catalogo, setCatalogo] = useState({ cursos: 20, escolas: 5 });
  useEffect(() => {
    let ativo = true;
    pedido("/cursos/")
      .then((lista) => {
        if (ativo && lista?.length) {
          setCatalogo({ cursos: lista.length, escolas: new Set(lista.map((c) => c.instituicao)).size });
        }
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, []);
  return catalogo;
}

function Pergunta({ indice, pergunta, resposta, aberta, alternar }) {
  const idResposta = `faq-resposta-${indice}`;
  return (
    <div className="overflow-hidden rounded-lg border border-borda bg-white shadow-sm">
      <h3>
        <button
          type="button"
          onClick={alternar}
          aria-expanded={aberta}
          aria-controls={idResposta}
          className="flex min-h-[56px] w-full cursor-pointer items-center justify-between gap-4 px-5 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primaria sm:px-8"
        >
          <span className="text-[17px] font-bold sm:text-[18px]">{pergunta}</span>
          <ChevronDown
            aria-hidden="true"
            className={`h-5 w-5 shrink-0 transition-transform duration-200 ${aberta ? "rotate-180 text-primaria" : "text-texto-suave"}`}
          />
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {aberta && (
          <motion.div
            id={idResposta}
            role="region"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <p className="border-t border-[#f0f2f6] px-5 pb-6 pt-4 text-[17px] font-medium leading-[1.6] text-texto-suave sm:px-8">
              {resposta}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Inicio() {
  const [perguntaAberta, setPerguntaAberta] = useState(0);
  const { cursos, escolas } = useCatalogo();
  const comecar = destinoComecar();
  const textoBotao = comecar.para === "/registo" ? "Começar agora" : comecar.texto;

  return (
    <div className="min-h-screen bg-white">
      <Cabecalho />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-noite text-white">
          <div className="absolute inset-0">
            <img
              src={heroGrande}
              srcSet={`${heroPequena} 768w, ${heroGrande} 1376w`}
              sizes="100vw"
              alt=""
              fetchpriority="high"
              className="h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-noite/85 via-noite/70 to-noite/85" />
          </div>

          <div className="relative mx-auto flex max-w-[1140px] flex-col items-center px-4 pb-[140px] pt-16 text-center sm:px-6 md:pb-[160px] md:pt-24">
            <p className="mb-4 text-[13px] font-bold uppercase tracking-wide sm:text-[14px]">
              Orientação vocacional para alunos da 9.ª classe
            </p>
            <h1 className="mb-6 max-w-[900px] text-[32px] font-extrabold uppercase leading-[1.15] tracking-tight sm:text-[44px] md:text-[56px]">
              Escolhe o teu curso com confiança
            </h1>
            <p className="mb-8 max-w-[68ch] text-[16px] font-medium leading-[1.6] text-white/95 md:text-[18px]">
              Ainda não sabes que curso técnico escolher? Vê quais combinam mais contigo, a partir das tuas notas e das
              tuas respostas.
            </p>
            <div className="flex w-full flex-col items-center gap-3 sm:w-auto">
              <Link
                to={comecar.para}
                className="inline-flex h-[52px] w-full items-center justify-center rounded-md bg-primaria px-9 text-[17px] font-bold text-white shadow-lg transition-all hover:bg-primaria-escura hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primaria/40 sm:w-auto"
              >
                {textoBotao}
              </Link>
              <p className="text-[14px] font-medium text-white/85">Sem criar conta. Só precisas do teu boletim de notas.</p>
            </div>
          </div>

          <FaixaSamakaka className="relative" />
        </section>

        {/* Como funciona */}
        {/* flow-root: impede que a margem negativa dos cartões "puxe" o fundo branco por cima da faixa samakaka */}
        <section className="relative z-20 flow-root bg-white" aria-labelledby="titulo-como-funciona">
          <div className="mx-auto max-w-[1140px] px-4 pb-24 sm:px-6 -mt-[88px]">
            <h2 id="titulo-como-funciona" className="sr-only">Como funciona</h2>
            <ol className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {PASSOS.map(({ icone: Icone, titulo, texto }, i) => (
                <li
                  key={titulo}
                  className="relative flex flex-col items-center rounded-xl border border-borda bg-white p-8 text-center shadow-[0_4px_24px_rgba(0,0,0,0.06)] transition-colors hover:border-primaria sm:p-10"
                >
                  <span aria-hidden="true" className="absolute left-6 top-6 flex h-7 w-7 items-center justify-center rounded-full border border-borda bg-fundo text-[13px] font-bold text-primaria">
                    {i + 1}
                  </span>
                  <span className="mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-primaria text-white shadow-sm">
                    <Icone className="h-[34px] w-[34px]" aria-hidden="true" />
                  </span>
                  <h3 className="mb-4 text-[20px] font-bold"><span className="sr-only">Passo {i + 1}: </span>{titulo}</h3>
                  <p className="text-[17px] font-medium leading-[1.6] text-texto-suave">{texto}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Os quatro perfis */}
        <section className="border-t border-borda bg-white py-20 md:py-24" aria-labelledby="titulo-perfis">
          <div className="mx-auto max-w-[1140px] px-4 sm:px-6">
            <div className="mx-auto mb-14 max-w-[800px] text-center md:mb-16">
              <p className="mb-3 text-[14px] font-bold uppercase tracking-wider text-primaria">Os quatro perfis</p>
              <h2 id="titulo-perfis" className="mb-5 text-[30px] font-bold tracking-tight md:text-[38px]">Qual é o teu perfil?</h2>
              <p className="mx-auto max-w-[65ch] text-[17px] font-medium leading-[1.6] text-texto-suave">
                Cada pessoa tem uma maneira própria de pensar e de agir. O teste ajuda-te a descobrir qual destes perfis
                está mais presente em ti. Nenhum é melhor do que o outro.
              </p>
            </div>
            <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {PERFIS.map(({ nome, icone: Icone, fundo, cor, texto, destaque }) => (
                <li
                  key={nome}
                  className={`flex flex-col rounded-xl border p-8 sm:p-10 ${
                    destaque
                      ? "border-primaria-escura bg-primaria text-white shadow-[0_8px_32px_rgba(31,111,192,0.25)]"
                      : "border-borda bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
                  }`}
                >
                  <span className={`mb-6 flex h-14 w-14 items-center justify-center rounded-lg ${destaque ? "bg-white text-primaria" : `${fundo} ${cor}`}`}>
                    <Icone className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <h3 className="mb-3 text-[20px] font-bold">{nome}</h3>
                  <span aria-hidden="true" className={`mb-4 h-[3px] w-8 rounded-full ${destaque ? "bg-white" : "bg-primaria"}`} />
                  <p className={`text-[17px] font-medium leading-[1.6] ${destaque ? "text-white/95" : "text-texto-suave"}`}>{texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Antes de começares */}
        <section className="border-t border-borda bg-fundo py-20 md:py-24" aria-labelledby="titulo-antes">
          <div className="mx-auto max-w-[1140px] px-4 sm:px-6">
            <h2 id="titulo-antes" className="mb-12 text-center text-[30px] font-bold tracking-tight md:mb-14 md:text-[38px]">Antes de começares</h2>
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {AVISOS.map(({ icone: Icone, titulo, texto }) => (
                <li key={titulo} className="flex flex-col rounded-xl border border-borda bg-white p-8 shadow-sm sm:p-10">
                  <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#f0f4f9] text-primaria">
                    <Icone className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mb-3.5 text-[20px] font-bold">{titulo}</h3>
                  <p className="text-[17px] font-medium leading-[1.6] text-texto-suave">{texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Os cursos e as escolas */}
        <section className="border-t border-borda bg-white py-20 md:py-24" aria-labelledby="titulo-escolas">
          <div className="mx-auto max-w-[1140px] px-4 sm:px-6">
            <div className="mx-auto mb-12 max-w-[800px] text-center md:mb-14">
              <p className="mb-3 text-[14px] font-bold uppercase tracking-wider text-primaria">Onde estão os cursos</p>
              <h2 id="titulo-escolas" className="mb-4 text-[30px] font-bold tracking-tight md:text-[38px]">
                {cursos} cursos técnicos em {escolas} escolas de Luanda
              </h2>
              <p className="mx-auto max-w-[65ch] text-[17px] font-medium leading-[1.6] text-texto-suave">
                Sugerimos cursos, não escolas. Para cada curso sugerido, mostramos em que escola é dado.
              </p>
            </div>
            <ul className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-5">
              {ESCOLAS.map(([sigla, area]) => (
                <li key={sigla} className="flex flex-col items-center rounded-lg border border-borda bg-white p-6 text-center transition-colors hover:border-primaria last:col-span-2 lg:last:col-span-1">
                  <span className="mb-2 text-[24px] font-extrabold tracking-tight text-primaria sm:text-[26px]">{sigla}</span>
                  <span className="text-[15px] font-semibold leading-snug text-texto-suave">{area}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Perguntas frequentes */}
        <section className="border-t border-borda bg-fundo py-20 md:py-24" aria-labelledby="titulo-faq">
          <div className="mx-auto max-w-[840px] px-4 sm:px-6">
            <h2 id="titulo-faq" className="mb-12 text-center text-[30px] font-bold tracking-tight md:mb-14 md:text-[38px]">Perguntas frequentes</h2>
            <div className="space-y-4">
              {PERGUNTAS.map(([pergunta, resposta], i) => (
                <Pergunta
                  key={pergunta}
                  indice={i}
                  pergunta={pergunta}
                  resposta={resposta}
                  aberta={perguntaAberta === i}
                  alternar={() => setPerguntaAberta(perguntaAberta === i ? null : i)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Chamada final */}
        <section className="bg-primaria py-20 text-white md:py-24">
          <div className="mx-auto flex max-w-[1140px] flex-col items-center px-4 text-center sm:px-6">
            <h2 className="mb-5 text-[30px] font-bold tracking-tight md:text-[38px]">Pronto para descobrir o teu caminho?</h2>
            <p className="mb-9 max-w-[65ch] text-[18px] font-medium leading-[1.6] text-white/95">
              Tem o teu boletim à mão e começa quando quiseres.
            </p>
            <Link
              to={comecar.para}
              className="inline-flex h-[52px] items-center rounded-md bg-white px-10 text-[17px] font-bold text-primaria shadow-lg transition-all hover:bg-slate-50 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
            >
              {textoBotao}
            </Link>
          </div>
        </section>
      </main>

      <Rodape />
    </div>
  );
}
