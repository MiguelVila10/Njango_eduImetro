// Página inicial do aluno (design do AI Studio, adaptado ao projecto).

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, Brush, CheckCircle, ChevronDown, Goal, GraduationCap, HeartHandshake,
  Briefcase, Cpu, Factory, Lightbulb, ListChecks, Microscope, NotebookPen, Palette,
  Stethoscope, Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { pedido } from "../../api/cliente";
import heroAlunos from "../../assets/hero-alunos.webp";
import heroAlunosPequena from "../../assets/hero-alunos-768.webp";
import heroImel from "../../assets/hero-imel.webp";
import heroImelPequena from "../../assets/hero-imel-768.webp";
import heroPatio from "../../assets/hero-patio.webp";
import heroPatioPequena from "../../assets/hero-patio-768.webp";
import Cabecalho, { destinoComecar } from "../../componentes/Cabecalho";
import { Contador, Revelar, SUAVE, SUBIR_HOVER, grelha, itemGrelha } from "../../componentes/Movimento";
import Rodape from "../../componentes/Rodape";
import SlideFundo from "../../componentes/SlideFundo";

// Fotografias do fundo do hero, pela ordem em que aparecem.
const FOTOS_HERO = [
  { grande: heroAlunos, pequena: heroAlunosPequena },
  { grande: heroImel, pequena: heroImelPequena },
  { grande: heroPatio, pequena: heroPatioPequena, posicao: "center 30%" },
];

const PASSOS = [
  { icone: NotebookPen, titulo: "Indica as tuas notas",
    texto: "Escreve as notas finais das 12 disciplinas que constam no certificado de conclusão do I Ciclo do Ensino Secundário. Elas mostram em que áreas tens mais facilidade." },
  { icone: ListChecks, titulo: "Responde ao teste",
    texto: "Escolhe o que farias em várias situações do dia-a-dia. As perguntas mudam conforme as tuas respostas." },
  { icone: GraduationCap, titulo: "Descobre os teus cursos",
    texto: "Recebes três cursos técnicos que combinam contigo. Para cada um, explicamos porquê." },
];

const PERFIS = [
  { nome: "Analítico", icone: Microscope, fundo: "bg-primaria-clara", cor: "text-primaria",
    texto: "Gostas de números, de experiências e de perceber como as coisas funcionam." },
  { nome: "Humanista", icone: HeartHandshake, fundo: "bg-humanista-claro", cor: "text-humanista",
    texto: "Gostas de ajudar, de ouvir os outros e de cuidar das pessoas." },
  { nome: "Criativo", icone: Brush, destaque: true,
    texto: "Gostas de desenhar, de criar e de dar forma às tuas ideias." },
  { nome: "Estrategista", icone: Goal, fundo: "bg-estrategista-claro", cor: "text-estrategista",
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
  ["ITEL", "Telecomunicações e Informática", Cpu],
  ["IPIL", "Indústria", Factory],
  ["IMEL", "Economia e Gestão", Briefcase],
  ["IMS", "Saúde", Stethoscope],
  ["CEARTE", "Arte", Palette],
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

/** Entrada do hero ao abrir a página: cada linha aparece um pouco depois da anterior. */
function entradaHero(ordem) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay: 0.1 + ordem * 0.1, ease: SUAVE },
  };
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
  const textoBotao = "Começar agora";

  return (
    <div className="min-h-screen bg-white">
      <Cabecalho />

      <main>
        {/* Hero: texto à esquerda, foto visível à direita (no telemóvel, tudo numa coluna) */}
        <section className="relative overflow-hidden bg-noite text-white">
          <div className="absolute inset-0">
            <SlideFundo fotos={FOTOS_HERO} />
            <div className="absolute inset-0 bg-gradient-to-b from-noite/90 via-noite/80 to-noite/90 md:bg-gradient-to-r md:from-noite/95 md:via-noite/75 md:to-noite/20" />
          </div>

          <div className="relative mx-auto max-w-[1140px] px-4 pb-[130px] pt-14 sm:px-6 md:pb-[170px] md:pt-24">
            <div className="max-w-[620px]">
              <motion.p {...entradaHero(0)} className="mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-semibold text-white/85 sm:text-[14px]">
                <span className="h-2 w-2 rounded-full bg-samakaka-amarelo" aria-hidden="true" />
                Sistema de orientação vocacional
                <span className="hidden text-white/50 sm:inline" aria-hidden="true">·</span>
                <span className="basis-full pl-4 sm:basis-auto sm:pl-0">Finalistas do I Ciclo do Ensino Secundário</span>
              </motion.p>
              <motion.h1 {...entradaHero(1)} className="mb-5 text-balance font-titulo text-[34px] font-extrabold leading-[1.1] tracking-[-0.015em] sm:text-[48px] md:text-[60px]">
                Descobre o curso técnico certo para ti.
              </motion.h1>
              <motion.p {...entradaHero(2)} className="mb-8 max-w-[52ch] text-[16px] leading-[1.65] text-white/85 md:text-[18px]">
                Juntamos as tuas notas e um teste adaptativo (CAT) para te sugerir os cursos que mais combinam contigo.
              </motion.p>
              <motion.div {...entradaHero(3)} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
                <Link
                  to={comecar.para}
                  className="inline-flex h-[54px] items-center justify-center gap-2 rounded-[10px] bg-primaria px-8 text-[17px] font-bold text-white shadow-lg transition-all hover:bg-primaria-escura hover:shadow-xl active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primaria/40"
                >
                  {textoBotao} <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </Link>
                <p className="text-[14px] text-white/75">Sem criar conta. Só precisas do teu certificado.</p>
              </motion.div>
              <motion.ul {...entradaHero(4)} className="mt-10 grid max-w-[600px] grid-cols-[1.6fr_1fr_1fr] gap-4 border-t border-white/15 pt-6">
                {[
                  ["12", "médias finais do certificado de conclusão do I Ciclo do Ensino Secundário"],
                  ["5 a 18", "perguntas no teste"],
                  ["Até 3", "cursos sugeridos"],
                ].map(([numero, texto]) => (
                  <li key={texto}>
                    <p className="font-titulo text-[22px] font-bold leading-tight md:text-[26px]">{numero}</p>
                    <p className="text-[13px] leading-snug text-white/70">{texto}</p>
                  </li>
                ))}
              </motion.ul>
            </div>
          </div>
        </section>

        {/* Como funciona */}
        {/* flow-root: os cartões sobem por cima da foto sem "puxar" o fundo branco da secção */}
        <section className="relative z-20 flow-root bg-white" aria-labelledby="titulo-como-funciona">
          <div className="mx-auto max-w-[1140px] px-4 pb-24 sm:px-6 -mt-[88px]">
            <h2 id="titulo-como-funciona" className="sr-only">Como funciona</h2>
            <motion.ol {...grelha} className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {PASSOS.map(({ icone: Icone, titulo, texto }, i) => (
                <motion.li
                  key={titulo}
                  {...itemGrelha}
                  className={`group relative flex flex-col items-center rounded-xl border border-borda bg-white p-8 text-center shadow-[0_4px_24px_rgba(0,0,0,0.06)] hover:border-primaria hover:shadow-[0_12px_32px_rgba(31,111,192,0.12)] sm:p-10 ${SUBIR_HOVER}`}
                >
                  <span aria-hidden="true" className="absolute left-6 top-6 flex h-7 w-7 items-center justify-center rounded-full border border-borda bg-fundo text-[13px] font-bold text-primaria">
                    {i + 1}
                  </span>
                  <span className="mb-6 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-primaria text-white shadow-sm transition-transform duration-300 motion-safe:group-hover:scale-105">
                    <Icone className="h-[34px] w-[34px]" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <h3 className="mb-4 text-[20px] font-bold"><span className="sr-only">Passo {i + 1}: </span>{titulo}</h3>
                  <p className="text-[17px] font-medium leading-[1.6] text-texto-suave">{texto}</p>
                </motion.li>
              ))}
            </motion.ol>
          </div>
        </section>

        {/* Os quatro perfis */}
        <section className="border-t border-borda bg-white py-20 md:py-24" aria-labelledby="titulo-perfis">
          <div className="mx-auto max-w-[1140px] px-4 sm:px-6">
            <Revelar className="mx-auto mb-14 max-w-[800px] text-center md:mb-16">
              <p className="mb-3 text-[14px] font-bold uppercase tracking-wider text-primaria">Os quatro perfis</p>
              <h2 id="titulo-perfis" className="mb-5 text-[30px] font-bold tracking-tight md:text-[38px]">Qual é o teu perfil?</h2>
              <p className="mx-auto max-w-[65ch] text-[17px] font-medium leading-[1.6] text-texto-suave">
                Cada pessoa tem uma maneira própria de pensar e de agir. O teste ajuda-te a descobrir qual destes perfis
                está mais presente em ti. Nenhum é melhor do que o outro.
              </p>
            </Revelar>
            <motion.ul {...grelha} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {PERFIS.map(({ nome, icone: Icone, fundo, cor, texto, destaque }, i) => (
                <motion.li
                  key={nome}
                  {...itemGrelha}
                  className={`group flex flex-col rounded-xl border p-8 hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] sm:p-10 ${SUBIR_HOVER} ${
                    destaque
                      ? "border-primaria-escura bg-primaria text-white shadow-[0_8px_32px_rgba(31,111,192,0.25)]"
                      : "border-borda bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
                  }`}
                >
                  <span className={`mb-6 flex h-14 w-14 items-center justify-center rounded-lg transition-transform duration-300 ease-out motion-safe:group-hover:scale-110 ${destaque ? "bg-white text-primaria" : `${fundo} ${cor}`}`}>
                    <Icone className="h-7 w-7" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <h3 className="mb-3 text-[20px] font-bold">{nome}</h3>
                  <span aria-hidden="true" className={`mb-4 h-[3px] w-8 rounded-full transition-[width] duration-300 motion-safe:group-hover:w-12 ${destaque ? "bg-white" : "bg-primaria"}`} />
                  <p className={`text-[17px] font-medium leading-[1.6] ${destaque ? "text-white/95" : "text-texto-suave"}`}>{texto}</p>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </section>

        {/* Antes de começares */}
        <section className="border-t border-borda bg-fundo py-20 md:py-24" aria-labelledby="titulo-antes">
          <div className="mx-auto max-w-[1140px] px-4 sm:px-6">
            <Revelar como="h2" id="titulo-antes" className="mb-12 text-center text-[30px] font-bold tracking-tight md:mb-14 md:text-[38px]">Antes de começares</Revelar>
            <motion.ul {...grelha} className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {AVISOS.map(({ icone: Icone, titulo, texto }, i) => (
                <motion.li key={titulo} {...itemGrelha} className={`flex flex-col rounded-xl border border-borda bg-white p-8 shadow-sm hover:shadow-[0_12px_32px_rgba(0,0,0,0.08)] sm:p-10 ${SUBIR_HOVER}`}>
                  <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#f0f4f9] text-primaria">
                    <Icone className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="mb-3.5 text-[20px] font-bold">{titulo}</h3>
                  <p className="text-[17px] font-medium leading-[1.6] text-texto-suave">{texto}</p>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </section>

        {/* Os cursos e as escolas */}
        <section className="border-t border-borda bg-white py-20 md:py-24" aria-labelledby="titulo-escolas">
          <div className="mx-auto max-w-[1140px] px-4 sm:px-6">
            <Revelar className="mx-auto mb-12 max-w-[800px] text-center md:mb-14">
              <p className="mb-3 text-[14px] font-bold uppercase tracking-wider text-primaria">Onde estão os cursos</p>
              <h2 id="titulo-escolas" className="mb-4 text-[30px] font-bold tracking-tight md:text-[38px]">
                <Contador valor={cursos} /> cursos técnicos em <Contador valor={escolas} /> escolas de Luanda
              </h2>
              <p className="mx-auto max-w-[65ch] text-[17px] font-medium leading-[1.6] text-texto-suave">
                Sugerimos cursos, não escolas. Para cada curso sugerido, mostramos em que escola é dado.
              </p>
            </Revelar>
            <motion.ul {...grelha} className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-5">
              {ESCOLAS.map(([sigla, area, Icone]) => (
                <motion.li key={sigla} {...itemGrelha} className={`group flex flex-col items-center rounded-lg border border-borda bg-white p-6 text-center hover:border-primaria last:col-span-2 lg:last:col-span-1 ${SUBIR_HOVER}`}>
                  <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primaria-clara text-primaria transition-transform duration-300 ease-out motion-safe:group-hover:scale-110">
                    <Icone className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span className="mb-2 text-[24px] font-extrabold tracking-tight text-primaria sm:text-[26px]">{sigla}</span>
                  <span className="text-[15px] font-semibold leading-snug text-texto-suave">{area}</span>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </section>

        {/* Perguntas frequentes */}
        <section className="border-t border-borda bg-fundo py-20 md:py-24" aria-labelledby="titulo-faq">
          <div className="mx-auto max-w-[840px] px-4 sm:px-6">
            <Revelar como="h2" id="titulo-faq" className="mb-12 text-center text-[30px] font-bold tracking-tight md:mb-14 md:text-[38px]">Perguntas frequentes</Revelar>
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
        <section className="bg-primaria py-8 text-white md:py-10">
          <Revelar className="mx-auto flex max-w-[1140px] flex-col items-center px-4 text-center sm:px-6">
            <h2 className="mb-2 text-[24px] font-bold tracking-tight md:text-[28px]">Pronto para descobrir o teu caminho?</h2>
            <p className="mb-5 max-w-[65ch] text-[16px] font-medium leading-[1.6] text-white/95">
              Tem o teu certificado à mão e começa quando quiseres.
            </p>
            <Link
              to={comecar.para}
              className="inline-flex h-12 items-center rounded-md bg-white px-8 text-[16px] font-bold text-primaria shadow-lg transition-all hover:bg-slate-50 hover:shadow-xl active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40"
            >
              {textoBotao}
            </Link>
          </Revelar>
        </section>
      </main>

      <Rodape />
    </div>
  );
}
