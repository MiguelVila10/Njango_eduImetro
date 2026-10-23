// Gráficos do painel do orientador, em SVG simples (sem bibliotecas):
// anel de proporção, donut com legenda e gráfico de actividade no tempo.
// Todos aceitam "animar" (botão Gráficos animados / estáticos).

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

const TRANSICAO = { duration: 0.8, ease: [0.22, 1, 0.36, 1] };

/** Anel pequeno com uma proporção (0–1) e um ícone ao centro (cartões do topo). */
export function Anel({ proporcao = 1, cor = "#1f6fc0", trilho = "#e3f0fc", icone: Icone, animar, rotulo }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, proporcao || 0));
  return (
    <span className="relative flex h-14 w-14 shrink-0 items-center justify-center" role="img" aria-label={rotulo}>
      <svg viewBox="0 0 60 60" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="30" cy="30" r={r} fill="none" stroke={trilho} strokeWidth="5" />
        <motion.circle
          cx="30" cy="30" r={r} fill="none" stroke={cor} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: animar ? c : c * (1 - p) }}
          animate={{ strokeDashoffset: c * (1 - p) }}
          transition={animar ? TRANSICAO : { duration: 0 }}
        />
      </svg>
      <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: cor, color: "#fff" }}>
        <Icone className="h-4 w-4" aria-hidden="true" />
      </span>
    </span>
  );
}

/**
 * Donut com valor ao centro. partes: [{ id, rotulo, valor, cor }].
 * Separação de 2px entre fatias; a legenda (fora) leva rótulo, número e %.
 */
export function Donut({ partes, centro, subcentro, animar, tamanho = 200, rotulo }) {
  const total = partes.reduce((s, p) => s + p.valor, 0);
  const r = 80;
  const c = 2 * Math.PI * r;
  const visiveis = partes.filter((p) => p.valor > 0);
  const espaco = visiveis.length > 1 ? 3 : 0;
  let inicio = 0;
  return (
    <div className="relative shrink-0" style={{ width: tamanho, height: tamanho }} role="img"
      aria-label={`${rotulo}: ${partes.map((p) => `${p.rotulo} ${p.valor}`).join(", ")}`}>
      <svg viewBox="0 0 200 200" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="100" cy="100" r={r} fill="none" stroke="#eef0f4" strokeWidth="26" />
        {total > 0 && visiveis.map((p, i) => {
          const comprimento = (p.valor / total) * c;
          const desenho = Math.max(0, comprimento - espaco);
          const deslocamento = -inicio;
          inicio += comprimento;
          return (
            <motion.circle
              key={p.id} cx="100" cy="100" r={r} fill="none" stroke={p.cor} strokeWidth="26"
              initial={{ strokeDasharray: `${animar ? 0 : desenho} ${c}` }}
              animate={{ strokeDasharray: `${desenho} ${c}` }}
              transition={animar ? { ...TRANSICAO, delay: 0.08 * i } : { duration: 0 }}
              strokeDashoffset={deslocamento}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[30px] font-bold leading-none tabular-nums">{centro}</span>
        {subcentro && <span className="mt-1 max-w-[110px] text-[12px] leading-tight text-texto-suave">{subcentro}</span>}
      </div>
    </div>
  );
}

const pctTexto = (v, total) => (total ? `${Math.round((v / total) * 100)}%` : "0%");

/** Legenda do donut: marca de cor, rótulo, número e percentagem (o texto não usa a cor da série). */
export function LegendaDonut({ partes, ligacao }) {
  const total = partes.reduce((s, p) => s + p.valor, 0);
  return (
    <ul className="flex w-full flex-col gap-2">
      {partes.map((p) => {
        const Icone = p.icone;
        const conteudo = (
          <>
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="h-3 w-3 shrink-0 rounded-[3px]" style={{ backgroundColor: p.cor }} aria-hidden="true" />
              {Icone && <Icone className="h-4 w-4 shrink-0 text-texto-suave" aria-hidden="true" />}
              <span className="leading-snug">{p.rotulo}</span>
            </span>
            <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
              <span className="font-bold">{p.valor}</span>
              <span className="w-10 text-right text-[13px] text-texto-suave">{pctTexto(p.valor, total)}</span>
            </span>
          </>
        );
        const classes = "flex items-center justify-between gap-3 rounded-[8px] px-3 py-2 text-[14px]";
        return (
          <li key={p.id}>
            {ligacao ? (
              <a href={ligacao(p)} className={`${classes} hover:bg-[#f3f5fa]`}>{conteudo}</a>
            ) : (
              <span className={classes}>{conteudo}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function divisaoBonita(maximo) {
  if (maximo <= 4) return 1;
  const bruto = maximo / 4;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  return [1, 2, 5, 10].map((f) => f * potencia).find((v) => v >= bruto);
}

/**
 * Actividade no tempo em barras agrupadas: por cada dia (ou semana), uma barra
 * por série, lado a lado, no mesmo eixo (as duas séries contam alunos).
 * Barras em vez de curva: são contagens inteiras, sem valores entre os dias.
 * Passar o rato (ou tocar) num dia mostra os números desse dia.
 */
export function GraficoActividade({ pontos, series, animar }) {
  const [activo, setActivo] = useState(null);
  const caixa = useRef(null);
  const [tamanho, setTamanho] = useState({ largura: 640, altura: 260 });
  useEffect(() => {
    const el = caixa.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const medir = () => setTamanho({ largura: Math.max(260, el.clientWidth), altura: Math.max(220, el.clientHeight) });
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const L = tamanho.largura, A = tamanho.altura, m = { e: 30, d: 6, t: 12, b: 28 };
  const largura = L - m.e - m.d, altura = A - m.t - m.b;

  const { maximo, passo } = useMemo(() => {
    const maior = Math.max(1, ...pontos.flatMap((p) => series.map((s) => p[s.chave])));
    const p = divisaoBonita(maior);
    return { maximo: Math.ceil(maior / p) * p, passo: p };
  }, [pontos, series]);

  const grupo = largura / pontos.length;
  const espacoGrupo = Math.min(14, grupo * 0.28);
  const larguraBarra = Math.max(3, Math.min(22, (grupo - espacoGrupo - 2 * (series.length - 1)) / series.length));
  const larguraGrupo = larguraBarra * series.length + 2 * (series.length - 1);
  const xGrupo = (i) => m.e + i * grupo + (grupo - larguraGrupo) / 2;
  const y = (v) => m.t + altura - (v / maximo) * altura;
  const marcas = [];
  for (let v = 0; v <= maximo; v += passo) marcas.push(v);
  const cada = Math.ceil(pontos.length / Math.max(2, Math.floor(largura / 64)));
  const raio = Math.min(4, larguraBarra / 2);

  return (
    <div ref={caixa} className="relative h-full min-h-[220px] w-full" onMouseLeave={() => setActivo(null)}>
      <svg width={L} height={A} viewBox={`0 0 ${L} ${A}`} className="absolute inset-0 block" role="img"
        aria-label={`Actividade: ${pontos.map((p) => `${p.rotulo}: ${series.map((s) => `${s.rotulo} ${p[s.chave]}`).join(", ")}`).join("; ")}`}>
        {marcas.map((v) => (
          <g key={v}>
            <line x1={m.e} x2={L - m.d} y1={y(v)} y2={y(v)} stroke="#e6e9ef" strokeDasharray={v === 0 ? "" : "3 4"} />
            <text x={m.e - 8} y={y(v) + 4} textAnchor="end" fontSize="12" fill="#5b6475">{v}</text>
          </g>
        ))}
        {pontos.map((p, i) => {
          if ((pontos.length - 1 - i) % cada !== 0) return null;
          return <text key={p.chave} x={m.e + i * grupo + grupo / 2} y={A - 8} textAnchor="middle" fontSize="12" fill="#5b6475">{p.rotulo}</text>;
        })}

        {activo != null && (
          <rect x={m.e + activo * grupo + 1} y={m.t} width={grupo - 2} height={altura} rx="6" fill="#1f6fc0" fillOpacity="0.06" />
        )}

        {pontos.map((p, i) => series.map((s, k) => {
          const v = p[s.chave];
          if (!v) return null;
          const alto = y(0) - y(v);
          const x0 = xGrupo(i) + k * (larguraBarra + 2);
          // Topo arredondado (4px), base direita assente no eixo.
          const d = `M${x0},${y(0)} V${y(v) + raio} Q${x0},${y(v)} ${x0 + raio},${y(v)} H${x0 + larguraBarra - raio} Q${x0 + larguraBarra},${y(v)} ${x0 + larguraBarra},${y(v) + raio} V${y(0)} Z`;
          return (
            <motion.path key={`${p.chave}-${s.chave}`} d={d} fill={s.cor}
              style={{ transformBox: "fill-box", transformOrigin: "bottom" }}
              initial={{ scaleY: animar ? 0 : 1 }} animate={{ scaleY: 1 }}
              transition={animar ? { duration: 0.6, delay: 0.02 * i, ease: [0.22, 1, 0.36, 1] } : { duration: 0 }}>
              <title>{`${p.titulo} · ${s.rotulo}: ${v}`}</title>
            </motion.path>
          );
        }))}

        {pontos.map((p, i) => (
          <rect key={`alvo-${p.chave}`} x={m.e + i * grupo} y={m.t} width={grupo} height={altura} fill="transparent"
            onMouseEnter={() => setActivo(i)} onClick={() => setActivo(i)} />
        ))}
      </svg>

      {activo != null && (
        <div className="pointer-events-none absolute top-1 z-10 rounded-[10px] bg-texto px-3 py-2 text-[12px] text-white shadow-lg"
          style={{
            left: `${((m.e + activo * grupo + grupo / 2) / L) * 100}%`,
            transform: `translateX(${activo > pontos.length * 0.7 ? "-100%" : activo < pontos.length * 0.3 ? "0%" : "-50%"})`,
          }}>
          <p className="mb-1 font-semibold">{pontos[activo].titulo}</p>
          {series.map((s) => (
            <p key={s.chave} className="flex items-center gap-2 whitespace-nowrap">
              <span className="h-2 w-2 rounded-[2px]" style={{ backgroundColor: s.cor }} aria-hidden="true" />
              {s.rotulo}: <strong className="tabular-nums">{pontos[activo][s.chave]}</strong>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
