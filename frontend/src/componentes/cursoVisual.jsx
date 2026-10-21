// Imagem ilustrativa de cada curso. Se existir uma ilustração em
// src/assets/cursos/<nome-do-curso>.webp (ver LEIA-ME.md nessa pasta), usa-a;
// se não, mostra um ícone escolhido pelas palavras do nome do curso.

import {
  Activity, Banknote, BookOpen, Briefcase, Calculator, Clapperboard, Cpu, FlaskConical, GraduationCap,
  HardHat, Laptop, Leaf, Megaphone, Music, Palette, Pill, Radio, ScanLine, Wrench, Zap,
} from "lucide-react";

const REGRAS = [
  [/telecomunica/i, Radio],
  [/electr[óo]nica|automa/i, Cpu],
  [/inform[áa]tica|multim[ée]dia/i, Laptop],
  [/energia|el[ée]ctric/i, Zap],
  [/constru/i, HardHat],
  [/mec[âa]nica/i, Wrench],
  [/qu[íi]mica/i, FlaskConical],
  [/farm[áa]cia/i, Pill],
  [/radiologia/i, ScanLine],
  [/fisioterapia/i, Activity],
  [/ambiental/i, Leaf],
  [/contabilidade/i, Calculator],
  [/finan[çc]as/i, Banknote],
  [/gest[ãa]o|empresa/i, Briefcase],
  [/comunica[çc][ãa]o social/i, Megaphone],
  [/m[úu]sica/i, Music],
  [/teatro|cinema/i, Clapperboard],
  [/artes|visuais|pl[áa]stica/i, Palette],
  [/educa|ensino/i, BookOpen],
];

// Ilustrações disponíveis, por nome de ficheiro (sem extensão).
const IMAGENS = Object.fromEntries(
  Object.entries(import.meta.glob("../assets/cursos/*.{webp,png,jpg,jpeg}", { eager: true, import: "default" })).map(
    ([caminho, url]) => [caminho.split("/").pop().replace(/\.[^.]+$/, ""), url],
  ),
);

/** "Técnico de Informática" → "tecnico-de-informatica" */
export function slugCurso(nome = "") {
  return nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function imagemDoCurso(nome) {
  return IMAGENS[slugCurso(nome)] ?? null;
}

export function iconeDoCurso(nome = "") {
  return REGRAS.find(([re]) => re.test(nome))?.[1] ?? GraduationCap;
}

/** Quadrado pequeno com o ícone do curso (cartões). */
export function IconeCurso({ nome, className = "" }) {
  const Icone = iconeDoCurso(nome);
  return (
    <span className={`flex items-center justify-center rounded-[14px] bg-primaria-clara text-primaria ${className}`} aria-hidden="true">
      <Icone className="h-1/2 w-1/2" strokeWidth={1.8} />
    </span>
  );
}

/** Painel grande com o ícone do curso sobre um fundo azul com formas (cabeçalho do curso). */
export function IlustracaoCurso({ nome, className = "" }) {
  const Icone = iconeDoCurso(nome);
  const imagem = imagemDoCurso(nome);
  if (imagem) {
    return (
      <div className={`relative overflow-hidden rounded-[18px] bg-primaria-clara ${className}`} aria-hidden="true">
        <img src={imagem} alt="" className="absolute inset-0 h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <div
      className={`relative overflow-hidden rounded-[18px] bg-gradient-to-br from-primaria to-primaria-escura ${className}`}
      aria-hidden="true"
    >
      <span className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
      <span className="absolute -bottom-14 -left-8 h-44 w-44 rounded-full bg-white/10" />
      <span className="absolute right-6 bottom-6 h-3 w-3 rounded-full bg-samakaka-amarelo" />
      <span className="absolute left-8 top-7 h-2 w-2 rounded-full bg-white/60" />
      <div className="relative flex h-full items-center justify-center">
        <span className="flex h-24 w-24 items-center justify-center rounded-[24px] bg-white/15 ring-1 ring-white/30 backdrop-blur-sm md:h-28 md:w-28">
          <Icone className="h-12 w-12 text-white md:h-14 md:w-14" strokeWidth={1.6} />
        </span>
      </div>
    </div>
  );
}
