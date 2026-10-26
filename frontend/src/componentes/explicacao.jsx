// Explicação de cada sugestão a partir dos dois processos do motor:
//  - notas: filtro SE-ENTÃO (notas mínimas) e semelhança com as notas ideais
//    do curso (score_academico, 60% da compatibilidade);
//  - teste: parte das respostas do aluno no perfil do curso
//    (score_psicografico, 40% da compatibilidade).
// Os textos usam só números que vêm da API, para o aluno perceber de onde
// vem a percentagem. `terceira` escreve para a família ("o aluno tem…").

import { Info, ListChecks, NotebookPen } from "lucide-react";

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

/** ["Humanista", "Estrategista"] → "Humanista e Estrategista (empate)". */
export function nomePerfis(lista = []) {
  return lista.length > 1 ? `${juntar(lista)} (empate)` : (lista[0] ?? "");
}

/**
 * Quando nenhuma sugestão é do perfil mais forte no teste, explica porquê:
 * os cursos desse perfil que as notas mínimas (regras das escolas) deixaram
 * de fora e o que falta em cada disciplina. O motor não muda; isto só mostra
 * o que aconteceu. `quem`: "aluno" (tu), "familia" (o aluno) ou "orientador".
 */
export function PerfilSemSugestao({ perfil, quem = "aluno", className = "" }) {
  const info = perfil?.perfil_sem_sugestao;
  if (!info) return null;
  const tu = quem === "aluno";
  const nomes = nomePerfis(perfil.dominantes);
  const varios = perfil.dominantes.length > 1;
  const { eliminados, passaram_mas_abaixo: abaixo } = info;
  const titulo = tu
    ? `Porque não aparecem cursos ${varios ? "dos teus perfis" : "do teu perfil"} ${nomes}?`
    : quem === "familia"
      ? `Porque não aparecem cursos do perfil ${nomes}?`
      : `Nenhuma sugestão do perfil do teste (${nomes})`;
  const inicio = tu
    ? `No teste, ${varios ? "os teus perfis mais fortes foram" : "o teu perfil mais forte foi"} ${nomes}.`
    : `No teste, ${varios ? "os perfis mais fortes foram" : "o perfil mais forte foi"} ${nomes}.`;
  return (
    <section className={`rounded-[16px] border-[1.5px] border-primaria/30 bg-primaria-clara/50 p-5 md:p-6 print:border-borda print:bg-transparent print:p-3 ${className}`}>
      <h2 className="mb-2 flex items-start gap-2 text-[17px] font-bold print:text-[12px]">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-primaria print:h-3.5 print:w-3.5" aria-hidden="true" /> {titulo}
      </h2>
      <p className="text-[15px] leading-relaxed text-texto-suave print:text-[10px]">
        {inicio}{" "}
        {eliminados.length > 0 && (
          <>Mas {eliminados.length === 1 ? "o curso deste perfil pede" : "os cursos deste perfil pedem"} notas mínimas que {tu ? "ainda não tens" : "o aluno ainda não tem"}.
          As notas mínimas são regras das escolas, por isso {eliminados.length === 1 ? "ficou" : "ficaram"} de fora:</>
        )}
        {eliminados.length === 0 && abaixo > 0 && (
          <>Os cursos deste perfil cumprem as notas mínimas, mas {tu ? "as tuas notas" : "as notas do aluno"} combinam mais com os cursos sugeridos, por isso ficaram mais abaixo na lista.</>
        )}
      </p>
      {eliminados.length > 0 && (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 print:grid-cols-2">
          {eliminados.map((c) => (
            <li key={c.curso_nome} className="rounded-[10px] bg-white px-3.5 py-2.5 text-[14px] leading-snug ring-1 ring-borda print:px-2 print:py-1 print:text-[9.5px]">
              <span className="font-semibold">{c.curso_nome}</span> <span className="text-texto-suave">({c.curso_instituicao})</span>
              <span className="mt-0.5 block text-texto-suave">
                {c.faltas.map((f) => `${f.disciplina}: ${tu ? "tens" : "tem"} ${f.nota}, pede ${f.nota_min}`).join(" · ")}
              </span>
            </li>
          ))}
        </ul>
      )}
      {eliminados.length > 0 && abaixo > 0 && (
        <p className="mt-3 text-[14px] text-texto-suave print:text-[9.5px]">
          {abaixo === 1 ? "Outro curso deste perfil cumpre" : `Outros ${abaixo} cursos deste perfil cumprem`} as notas mínimas, mas {abaixo === 1 ? "ficou" : "ficaram"} mais abaixo por causa das notas.
        </p>
      )}
      {quem !== "orientador" && (
        <p className="mt-3 text-[14px] font-medium text-texto print:text-[9.5px]">
          {tu
            ? "As sugestões abaixo são os cursos que já cumprem as notas mínimas e que mais combinam contigo. Se melhorares essas notas, os cursos do teu perfil podem passar a aparecer."
            : "As sugestões são os cursos que já cumprem as notas mínimas. Se o aluno melhorar essas notas, os cursos do seu perfil podem passar a aparecer."}
        </p>
      )}
    </section>
  );
}

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
                    <span className={(perfil.dominantes ?? [topo.arquetipo]).includes(a.arquetipo) ? "font-bold" : "text-texto-suave"}>{a.arquetipo}</span>
                    <span className="h-2 overflow-hidden rounded-full bg-white ring-1 ring-borda">
                      <span className="block h-full rounded-full bg-primaria" style={{ width: `${pct(a.percentagem)}%` }} />
                    </span>
                    <span className="text-right font-semibold tabular-nums">{pct(a.percentagem)}%</span>
                  </li>
                ))}
              </ul>
              <p className="text-[14px] leading-relaxed text-texto-suave">
                {(perfil.dominantes?.length ?? 0) > 1 ? (
                  <>
                    Empate: os teus perfis mais fortes foram <strong className="text-texto">{juntar(perfil.dominantes)}</strong>. Gostas de{" "}
                    {juntar(perfil.dominantes.map((d) => PERFIS[d]))}.
                  </>
                ) : (
                  <>O teu perfil mais forte foi <strong className="text-texto">{topo.arquetipo}</strong>: gostas de {PERFIS[topo.arquetipo]}.</>
                )}
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

// ---------------------------------------------------------------------------
// "O que isto quer dizer": leitura simples dos números, para um aluno de 15
// anos perceber cada passo sem precisar de saber como o motor funciona.

export function leituraNotasMinimas(rec) {
  const req = (rec.notas_minimas ?? []).filter((r) => r.tua_nota != null);
  if (!req.length) {
    return "Este curso não exige uma nota mínima numa disciplina específica, por isso qualquer aluno com as notas da 9.ª classe pode ser considerado.";
  }
  const disciplinas = juntar(req.map((r) => r.disciplina));
  const iguais = new Set(req.map((r) => r.nota_min)).size === 1;
  const pede = iguais ? `pelo menos ${req[0].nota_min} a ${disciplinas}` : `uma nota mínima a ${disciplinas}`;
  const folga = req.every((r) => r.tua_nota > r.nota_min);
  return (
    `Para entrar neste curso, a escola pede ${pede}. ` +
    (folga ? "As tuas notas são mais altas do que isso em todas, " : "As tuas notas chegam ao mínimo em todas, ") +
    "por isso o curso pode ser uma opção para ti. Se tivesses menos do que o mínimo numa delas, o curso nem aparecia na lista."
  );
}

export function leituraNotasIdeais(rec) {
  const p = pct(rec.score_academico);
  const chave = (rec.disciplinas_chave ?? []).filter((d) => d.tua_nota != null);
  const noNivel = chave.filter((d) => d.tua_nota >= d.referencia).map((d) => d.disciplina);
  const abaixo = chave.filter((d) => d.tua_nota < d.referencia);
  const quanto = p >= 85 ? "muito parecidas" : p >= 70 ? "parecidas" : "parecidas só em parte";
  let texto = `${p}% quer dizer que as tuas notas são ${quanto} com as de um aluno que se dá bem neste curso.`;
  if (noNivel.length) texto += ` Já estás no nível em ${juntar(noNivel)}.`;
  if (abaixo.length) {
    const perto = abaixo.every((d) => d.referencia - d.tua_nota <= 2);
    texto += ` Em ${juntar(abaixo.map((d) => d.disciplina))} estás ${perto ? "perto" : "um pouco abaixo"}: se melhorares, vais sentir-te mais à vontade no curso.`;
  }
  return texto;
}

export function leituraTeste(rec) {
  const perfil = rec.perfil_aluno;
  const arq = rec.curso_arquetipo;
  if (!perfil?.total) return `Este curso é para quem gosta de ${PERFIS[arq]}.`;
  const doCurso = perfil.arquetipos.find((a) => a.arquetipo === arq) ?? { respostas: 0, percentagem: 0 };
  const topo = perfil.arquetipos[0];
  let texto =
    "No teste escolheste, em cada situação, o que preferias fazer. Cada resposta mostra um tipo de interesse (um perfil). " +
    `Este curso é do perfil ${arq}: para quem gosta de ${PERFIS[arq]}. `;
  if (topo.arquetipo === arq) {
    texto += `Foi o perfil que escolheste mais vezes (${pct(doCurso.percentagem)}%), por isso o curso combina muito com o que gostas de fazer.`;
  } else if (doCurso.percentagem >= 0.25) {
    texto += `Escolheste mais vezes o perfil ${topo.arquetipo}, mas o perfil deste curso também aparece bastante nas tuas respostas (${pct(doCurso.percentagem)}%).`;
  } else {
    texto += `Escolheste mais vezes o perfil ${topo.arquetipo}. O perfil deste curso apareceu pouco (${pct(doCurso.percentagem)}%), por isso o curso combina contigo sobretudo pelas notas.`;
  }
  return texto;
}

export function leituraSoma(rec, primeira) {
  const a = pct(rec.score_academico);
  const t = pct(rec.score_psicografico);
  const f = pct(rec.score_final);
  let texto =
    `Para calcular a compatibilidade, as notas contam mais (60%) do que o teste (40%). As tuas notas deram ${a}% e o teste deu ${t}%. ` +
    `Juntando os dois, este curso combina ${f}% contigo. Quanto maior a percentagem, mais o curso combina com as tuas notas e com o que gostas de fazer.`;
  if (primeira && primeira.id !== rec.id) {
    texto += ` Ficou atrás de ${primeira.curso_nome} (${pct(primeira.score_final)}%), mas continua a ser uma boa opção.`;
  } else {
    texto += " É a sugestão que mais combina contigo.";
  }
  return texto;
}

/** Uma frase simples para o cartão da sugestão (o detalhe fica no ecrã do curso). */
export function resumoSugestao(rec) {
  const req = (rec.notas_minimas ?? []).filter((r) => r.tua_nota != null);
  const minimos = req.length
    ? `Tens as notas mínimas em ${juntar(req.map((r) => r.disciplina))}`
    : "O curso não pede notas mínimas específicas";
  const p = pct(rec.score_academico);
  const quanto = p >= 85 ? "muito parecidas" : p >= 70 ? "parecidas" : "parecidas em parte";
  const perfil = rec.perfil_aluno;
  const arq = rec.curso_arquetipo;
  const doCurso = perfil?.arquetipos?.find((a) => a.arquetipo === arq);
  let teste = "";
  if (doCurso && perfil.total) {
    const t = pct(doCurso.percentagem);
    if (perfil.arquetipos[0].arquetipo === arq) teste = ` e o perfil ${arq} foi o que mais escolheste no teste (${t}%)`;
    else if (doCurso.percentagem >= 0.25) teste = ` e o perfil ${arq} aparece bastante nas tuas respostas ao teste (${t}%)`;
    else teste = `; no teste, o perfil ${arq} apareceu pouco (${t}%)`;
  }
  return `${minimos}, as tuas notas são ${quanto} com as do curso (${p}%)${teste}.`;
}
