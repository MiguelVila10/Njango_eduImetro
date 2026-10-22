// Peças da área do orientador (design "Njango Edu — Painel"): cores dos
// perfis, etiquetas de perfil e de estado, cartão base e nomes curtos.

import { Check, Hourglass, TriangleAlert, X } from "lucide-react";

// Cores dos quatro perfis (DESIGN.md do painel).
export const COR_PERFIL = {
  Analítico: "#1f6fc0",
  Humanista: "#1e8e5a",
  Criativo: "#c2410c",
  Estrategista: "#6b4fa0",
};
export const ORDEM_PERFIS = ["Analítico", "Humanista", "Criativo", "Estrategista"];

export const ESCOLA_DEMO = "Escola de demonstração";

export function AvisoDemonstracao({ className = "" }) {
  return (
    <span
      className={`inline-block rounded-[6px] bg-[#eef0f4] px-2.5 py-1 text-[12px] font-medium text-texto-suave ${className}`}
      title='Alunos da "Escola de demonstração": dados simulados para apresentar o sistema.'
    >
      Dados de demonstração
    </span>
  );
}

export function EtiquetaPerfil({ perfil }) {
  if (!perfil) return <span className="text-texto-suave" aria-label="Sem perfil ainda">—</span>;
  const cor = COR_PERFIL[perfil] ?? "#5b6475";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold"
      style={{ color: cor, backgroundColor: `${cor}14` }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cor }} aria-hidden="true" />
      {perfil}
    </span>
  );
}

export const ESTADOS = {
  concluido: { texto: "Concluído", icone: Check, classes: "bg-emerald-50 text-emerald-700" },
  ponto_de_atencao: { texto: "Ponto de atenção", icone: TriangleAlert, classes: "bg-[#fff4e0] text-[#9a5b00]" },
  sem_curso_compativel: { texto: "Sem curso compatível", icone: X, classes: "bg-red-50 text-red-700" },
  por_terminar: { texto: "Por terminar", icone: Hourglass, classes: "bg-[#eef0f7] text-texto-suave" },
};

export function EtiquetaEstado({ estado, quadrada = false, quebra = false }) {
  const e = ESTADOS[estado] ?? ESTADOS.por_terminar;
  const Icone = e.icone;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 font-semibold ${quebra ? "" : "whitespace-nowrap"} ${quadrada ? "rounded-[6px] text-[13px]" : "rounded-full text-[12px]"} ${e.classes}`}>
      <Icone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {e.texto}
    </span>
  );
}

export function Cartao({ className = "", children, ...props }) {
  return (
    <section
      className={`min-w-0 rounded-[12px] border border-borda bg-white shadow-[0_2px_8px_rgba(37,43,66,0.04),0_1px_2px_rgba(37,43,66,0.02)] ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}

/** "Técnico de Informática" → "Informática" (como no design). */
export function nomeCurtoCurso(nome = "") {
  return nome.replace(/^Técnico\s+(de\s+|em\s+)?/i, "").replace(/^\p{Ll}/u, (l) => l.toUpperCase());
}

/** "Ana Kiluange Domingos" → "Ana K." (no painel não se mostra o nome completo dos alunos). */
export function nomeAbreviado(nome = "") {
  const partes = nome.trim().split(/\s+/);
  if (partes.length < 2) return partes[0] ?? "";
  return `${partes[0]} ${partes[1][0]}.`;
}

export const dataCurta = (iso) =>
  iso ? new Date(iso).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
