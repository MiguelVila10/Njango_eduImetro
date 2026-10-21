// Explicação de cada sugestão a partir dos dois processos do motor:
//  - notas: filtro SE-ENTÃO (notas mínimas) e semelhança com as notas ideais
//    do curso (score_academico, 60% da compatibilidade);
//  - teste: parte das respostas do aluno no perfil do curso
//    (score_psicografico, 40% da compatibilidade).
// Os textos usam só números que vêm da API, para o aluno perceber de onde
// vem a percentagem. `terceira` escreve para a família ("o aluno tem…").

import { ListChecks, NotebookPen } from "lucide-react";

export const PERFIS = {
  Analítico: "perceber como as coisas funcionam, fazer contas e experiências e resolver problemas com lógica",
  Humanista: "estar com pessoas, comunicar, ensinar, ajudar e cuidar dos outros",
  Criativo: "criar, desenhar, imaginar e fazer coisas novas, com as mãos ou com a arte",
  Estrategista: "organizar, planear, gerir e liderar projectos e pessoas",
};

const pct = (v) => Math.round((v ?? 0) * 100);

export function juntar(lista) {
  if (lista.length <= 1) return lista.join("");
  return `${lista.slice(0, -1).join(", ")} e ${lista[lista.length - 1]}`;
}

const valores = (n) => (n === 1 ? "1 valor" : `${n} valores`);

/** Parágrafos da parte das notas. */
export function explicarNotas(rec, { terceira = false } = {}) {
  const tem = terceira ? "Tem" : "Tens";
  const estas = terceira ? "está" : "estás";
  const tuas = terceira ? "as suas notas" : "as tuas notas";
  const partes = [];

  const req = (rec.notas_minimas ?? []).filter((r) => r.tua_nota != null);
  if (req.length) {
    const pede = juntar(req.map((r) => `${r.nota_min} a ${r.disciplina}`));
    const notas = juntar(req.map((r) => String(r.tua_nota)));
    const margens = req.map((r) => r.tua_nota - r.nota_min);
    const acima = margens.every((m) => m === 0)
      ? "exactamente o mínimo"
      : margens.length === 1
        ? `${valores(margens[0])} acima do mínimo`
        : `respectivamente ${juntar(margens.map(String))} valores acima do mínimo`;
    partes.push(`O curso pede pelo menos ${pede}. ${tem} ${notas}: ${acima}. Por isso o curso passou o primeiro filtro.`);
  } else {
    partes.push("Este curso não pede nota mínima em disciplinas específicas, por isso passou o primeiro filtro.");
  }

  const chave = (rec.disciplinas_chave ?? []).filter((d) => d.tua_nota != null);
  if (chave.length) {
    const noNivel = chave.filter((d) => d.tua_nota >= d.referencia).map((d) => d.disciplina);
    const abaixo = chave.filter((d) => d.tua_nota < d.referencia);
    let frase = `Nas disciplinas que mais contam para este curso (${juntar(chave.map((d) => d.disciplina))}), `;
    if (noNivel.length) frase += `${estas} no nível ideal ou acima em ${juntar(noNivel)}`;
    if (noNivel.length && abaixo.length) frase += "; ";
    if (abaixo.length) {
      frase += juntar(abaixo.map((d) => `em ${d.disciplina} ${estas} ${valores(d.referencia - d.tua_nota)} abaixo do ideal`));
    }
    partes.push(`${frase}.`);
  }
  partes.push(`No conjunto das 12 disciplinas, ${tuas} são ${pct(rec.score_academico)}% parecidas com as notas ideais deste curso.`);
  return partes;
}

/** Parágrafos da parte do teste. */
export function explicarTeste(rec, { terceira = false } = {}) {
  const perfil = rec.perfil_aluno;
  const arq = rec.curso_arquetipo;
  if (!perfil?.total) return [`Este curso é do perfil ${arq}.`];
  const doCurso = perfil.arquetipos.find((a) => a.arquetipo === arq) ?? { respostas: 0, percentagem: 0 };
  const topo = perfil.arquetipos[0];
  const deste = terceira ? "deu" : "deste";
  const teu = terceira ? "o seu" : "o teu";

  const partes = [
    `No teste ${deste} ${perfil.total} respostas. ${doCurso.respostas} ${doCurso.respostas === 1 ? "foi uma escolha" : "foram escolhas"} do perfil ${arq} (${pct(doCurso.percentagem)}%), que é o perfil deste curso: quem gosta de ${PERFIS[arq] ?? "este tipo de actividades"}.`,
  ];
  if (topo.arquetipo === arq) {
    partes.push(`Foi ${teu} perfil mais forte no teste, por isso este curso combina muito com o que ${terceira ? "escolheu" : "escolheste"}.`);
  } else if (doCurso.percentagem >= 0.25) {
    partes.push(`${terceira ? "O seu" : "O teu"} perfil mais forte foi ${topo.arquetipo} (${pct(topo.percentagem)}%), mas também ${terceira ? "mostrou" : "mostraste"} bastante interesse pelo perfil deste curso.`);
  } else {
    partes.push(`${terceira ? "O seu" : "O teu"} perfil mais forte foi ${topo.arquetipo} (${pct(topo.percentagem)}%). Este curso entrou sobretudo pelas notas.`);
  }
  return partes;
}

export function explicarCalculo(rec) {
  return `60% × ${pct(rec.score_academico)}% (notas) + 40% × ${pct(rec.score_psicografico)}% (respostas) ≈ ${pct(rec.score_final)}% de compatibilidade.`;
}

/** Panorama do aluno nos dois processos (topo das sugestões). */
export function PanoramaPerfil({ perfil, notas }) {
  const lista = Object.entries(notas ?? {}).sort((a, b) => b[1] - a[1]);
  const media = lista.length ? lista.reduce((s, [, n]) => s + n, 0) / lista.length : null;
  const fortes = lista.slice(0, 3);
  const topo = perfil?.arquetipos?.[0];
  return (
    <section className="mb-8 rounded-[16px] border-[1.5px] border-borda bg-white p-6 md:p-8" aria-labelledby="panorama-titulo">
      <h2 id="panorama-titulo" className="mb-1 text-[20px] font-bold">O teu perfil nos dois processos</h2>
      <p className="mb-5 text-[14px] text-texto-suave">É daqui que vêm as sugestões: as tuas notas e as tuas escolhas no teste.</p>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-[12px] bg-fundo p-5 ring-1 ring-borda">
          <h3 className="mb-3 flex items-center gap-2 text-[15px] font-bold">
            <NotebookPen className="h-[18px] w-[18px] text-primaria" aria-hidden="true" /> As tuas notas
          </h3>
          {lista.length ? (
            <>
              <p className="mb-3 text-[14px] text-texto-suave">
                Média de <strong className="text-texto">{media.toFixed(1).replace(".", ",")}</strong> valores. As tuas notas mais altas:
              </p>
              <ul className="flex flex-wrap gap-2">
                {fortes.map(([d, n]) => (
                  <li key={d} className="rounded-[8px] bg-white px-3 py-1.5 text-[14px] ring-1 ring-borda">
                    {d} <strong className="tabular-nums">{n}</strong>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-[14px] text-texto-suave">A carregar…</p>
          )}
        </div>
        <div className="rounded-[12px] bg-fundo p-5 ring-1 ring-borda">
          <h3 className="mb-3 flex items-center gap-2 text-[15px] font-bold">
            <ListChecks className="h-[18px] w-[18px] text-primaria" aria-hidden="true" /> As tuas respostas ao teste
          </h3>
          {perfil?.total ? (
            <>
              <ul className="mb-3 flex flex-col gap-2">
                {perfil.arquetipos.map((a) => (
                  <li key={a.arquetipo} className="grid grid-cols-[96px_1fr_40px] items-center gap-3 text-[13px]">
                    <span className={a === topo ? "font-bold" : "text-texto-suave"}>{a.arquetipo}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-white ring-1 ring-borda">
                      <span className="block h-full rounded-full bg-primaria" style={{ width: `${pct(a.percentagem)}%` }} />
                    </span>
                    <span className="text-right font-semibold tabular-nums">{pct(a.percentagem)}%</span>
                  </li>
                ))}
              </ul>
              <p className="text-[14px] leading-relaxed text-texto-suave">
                O teu perfil mais forte foi <strong className="text-texto">{topo.arquetipo}</strong>: gostas de {PERFIS[topo.arquetipo]}.
              </p>
            </>
          ) : (
            <p className="text-[14px] text-texto-suave">Sem respostas registadas.</p>
          )}
        </div>
      </div>
    </section>
  );
}
