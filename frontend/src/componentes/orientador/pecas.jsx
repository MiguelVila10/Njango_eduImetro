// Peças da área do orientador (design "Njango Edu — Painel"): cores dos
// perfis, etiquetas de perfil e de estado, cartão base e nomes curtos.

import { Check, ChevronDown, Hourglass, TriangleAlert, X } from "lucide-react";

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

/** Caixa de filtro das listas ("Estado: Todos"). */
export function Filtro({ rotulo, valor, aoMudar, opcoes }) {
  return (
    <div className="relative">
      <select
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        aria-label={rotulo}
        className="h-12 w-full cursor-pointer appearance-none rounded-[12px] border border-borda bg-white pl-3.5 pr-9 text-[14px] font-medium text-texto shadow-xs focus:border-primaria focus:outline-none focus:ring-1 focus:ring-primaria"
      >
        <option value="">{rotulo}: Todos</option>
        {opcoes.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-suave" aria-hidden="true" />
    </div>
  );
}

/** Páginas das listas: ‹ Anterior 1 2 … 6 Seguinte ›. */
export function Paginas({ pagina, total, aoMudar }) {
  if (total <= 1) return null;
  // 1 2 3 … 6: primeira, última e as vizinhas da actual
  const numeros = [...new Set([1, pagina - 1, pagina, pagina + 1, total])].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const itens = numeros.flatMap((n, i) => (i > 0 && n - numeros[i - 1] > 1 ? ["…", n] : [n]));
  const botao = "flex h-9 min-w-9 items-center justify-center rounded-[8px] px-2 text-[14px] font-semibold";
  return (
    <nav aria-label="Páginas" className="flex items-center gap-1">
      <button type="button" disabled={pagina === 1} onClick={() => aoMudar(pagina - 1)}
        className={`${botao} text-texto-suave enabled:hover:bg-fundo disabled:opacity-50`}>‹ Anterior</button>
      {itens.map((n, i) => n === "…" ? (
        <span key={`r${i}`} className="px-1 text-texto-suave">…</span>
      ) : (
        <button key={n} type="button" onClick={() => aoMudar(n)} aria-current={n === pagina ? "page" : undefined}
          className={`${botao} ${n === pagina ? "bg-primaria text-white" : "text-texto hover:bg-fundo"}`}>{n}</button>
      ))}
      <button type="button" disabled={pagina === total} onClick={() => aoMudar(pagina + 1)}
        className={`${botao} text-texto enabled:hover:bg-fundo disabled:opacity-50`}>Seguinte ›</button>
    </nav>
  );
}
