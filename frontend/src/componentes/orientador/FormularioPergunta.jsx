// Painel lateral "Adicionar pergunta" / "Editar pergunta" (design "Njango
// Edu — Perguntas do teste", Frame B). Uma opção por perfil; a opção marcada
// como "resposta certa para a maioria" é a tendência da pergunta (conta menos
// no resultado). Perguntas de verificação confirmam uma pergunta principal.

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ChevronDown, LoaderCircle, TriangleAlert, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { alterarPergunta, criarPergunta } from "../../api/orientador";
import { COR_PERFIL, ORDEM_PERFIS } from "./pecas";

const curto = (t = "", n = 70) => (t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t);

function estadoInicial(pergunta) {
  const textos = Object.fromEntries(ORDEM_PERFIS.map((p) => [p, ""]));
  for (const o of pergunta?.opcoes ?? []) textos[o.arquetipo] = o.texto ?? "";
  return {
    texto: pergunta?.texto ?? "",
    tipo: pergunta?.tipo ?? "nucleo",
    confirma: "",
    certa: ORDEM_PERFIS.includes(pergunta?.tendencia) ? pergunta.tendencia : "",
    opcoes: textos,
  };
}

function validar(p, editar, temPar) {
  const e = { opcoes: {} };
  if (p.texto.trim().length < 10) e.texto = "Descreva a situação da pergunta (pelo menos uma frase).";
  for (const perfil of ORDEM_PERFIS) {
    if (!p.opcoes[perfil].trim()) e.opcoes[perfil] = "Escreva o texto desta opção. Cada pergunta precisa de uma opção para cada perfil.";
  }
  if (p.tipo === "verificacao" && !p.confirma && !(editar && temPar)) {
    e.confirma = "Escolha a pergunta principal que esta pergunta confirma.";
  }
  return e;
}
const temErros = (e) => Boolean(e.texto || e.confirma || e.geral || Object.keys(e.opcoes ?? {}).length);

function Erro({ children, id }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-[13px] font-medium leading-snug text-[#c0392b]">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /> {children}
    </p>
  );
}

const CAMPO = "rounded-[8px] border bg-white text-[15px] text-texto placeholder:text-texto-suave/70 focus:outline-none focus:ring-4";
const classe = (erro) => `${CAMPO} ${erro ? "border-2 border-[#c0392b] focus:ring-red-100" : "border-borda focus:border-primaria focus:ring-primaria/15"}`;

export default function FormularioPergunta({ aberto, pergunta = null, principais = [], aoFechar, aoGuardar }) {
  const editar = Boolean(pergunta);
  const temPar = Boolean(pergunta?.par_coerencia);
  const [p, setP] = useState(() => estadoInicial(pergunta));
  const [erros, setErros] = useState({ opcoes: {} });
  const [tentou, setTentou] = useState(false);
  const [aGuardar, setAGuardar] = useState(false);
  const painel = useRef(null);

  useEffect(() => {
    if (!aberto) return undefined;
    setP(estadoInicial(pergunta)); setErros({ opcoes: {} }); setTentou(false);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => painel.current?.querySelector("#pergunta-texto")?.focus(), 60);
    return () => { clearTimeout(t); document.body.style.overflow = antes; };
  }, [aberto, pergunta]);

  useEffect(() => {
    if (!aberto) return undefined;
    const tecla = (e) => e.key === "Escape" && !aGuardar && aoFechar();
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [aberto, aGuardar, aoFechar]);

  function mudar(alteracao) {
    const novo = { ...p, ...alteracao };
    setP(novo);
    if (tentou) setErros(validar(novo, editar, temPar));
  }

  async function guardar(e) {
    e.preventDefault();
    setTentou(true);
    const encontrados = validar(p, editar, temPar);
    setErros(encontrados);
    if (temErros(encontrados)) {
      painel.current?.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    setAGuardar(true);
    // Mantém os campos extra das opções que já existiam (faceta, peso).
    const antigas = Object.fromEntries((pergunta?.opcoes ?? []).map((o) => [o.arquetipo, o]));
    const corpo = {
      texto: p.texto.trim(),
      tipo: p.tipo,
      tendencia: p.certa || "neutra",
      opcoes: ORDEM_PERFIS.map((perfil) => ({ ...(antigas[perfil] ?? {}), arquetipo: perfil, texto: p.opcoes[perfil].trim() })),
    };
    if (p.tipo === "verificacao" && p.confirma) corpo.confirma = Number(p.confirma);
    try {
      const guardada = editar ? await alterarPergunta(pergunta.id, corpo) : await criarPergunta(corpo);
      aoGuardar(guardada);
    } catch (err) {
      const d = err.status === 400 && err.dados && typeof err.dados === "object" ? err.dados : null;
      const primeiro = (v) => [].concat(v)[0];
      if (d) {
        const doServidor = { opcoes: {} };
        if (d.texto) doServidor.texto = primeiro(d.texto);
        if (d.confirma) doServidor.confirma = primeiro(d.confirma);
        if (d.opcoes) doServidor.geral = primeiro(d.opcoes);
        if (d.tipo || d.tendencia) doServidor.geral = primeiro(d.tipo ?? d.tendencia);
        if (!temErros(doServidor)) doServidor.geral = err.message;
        setErros(doServidor);
      } else {
        setErros({ opcoes: {}, geral: err.message });
      }
    } finally {
      setAGuardar(false);
    }
  }

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div className="fixed inset-0 z-50 flex justify-end bg-texto/40"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && !aGuardar && aoFechar()}>
          <motion.form ref={painel} onSubmit={guardar} noValidate role="dialog" aria-modal="true" aria-labelledby="pergunta-titulo"
            className="flex h-full w-full max-w-[520px] flex-col bg-white shadow-[0_16px_36px_rgba(37,43,66,0.12)]"
            initial={{ x: 520 }} animate={{ x: 0 }} exit={{ x: 520 }} transition={{ type: "spring", stiffness: 380, damping: 40 }}>
            <div className="border-b border-borda px-6 pb-5 pt-6">
              <div className="flex items-start justify-between gap-3">
                <h2 id="pergunta-titulo" className="text-[24px] font-bold tracking-tight">{editar ? "Editar pergunta" : "Adicionar pergunta"}</h2>
                <button type="button" onClick={aoFechar} disabled={aGuardar} aria-label="Fechar painel"
                  className="-mr-2 -mt-1 flex h-10 w-10 items-center justify-center rounded-full text-texto-suave hover:bg-fundo">
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <p className="mt-2 text-[14px] leading-relaxed text-texto-suave">
                Descreva uma situação do dia-a-dia que um aluno de 13 a 17 anos reconheça. Não há respostas certas nem erradas.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {editar && pergunta.total_respostas > 0 && (
                <p className="mb-6 flex items-start gap-2 rounded-[10px] bg-[#fff4e0] px-4 py-3 text-[13px] leading-relaxed text-[#9a5b00]">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  Esta pergunta já foi respondida {pergunta.total_respostas} {pergunta.total_respostas === 1 ? "vez" : "vezes"}. As respostas
                  ficam guardadas. Para corrigir um erro de escrita, edite; se a pergunta mudar de sentido, é melhor desactivá-la e criar uma nova.
                </p>
              )}

              <section className="flex flex-col gap-5">
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-texto-suave">Pergunta</h3>
                <div>
                  <label htmlFor="pergunta-texto" className="mb-1.5 block text-[14px] font-semibold">Situação</label>
                  <textarea id="pergunta-texto" rows={3} maxLength={400} value={p.texto} onChange={(e) => mudar({ texto: e.target.value })}
                    placeholder="Ex.: Na tua turma vão fazer um trabalho sobre o bairro. Tu…"
                    aria-invalid={Boolean(erros.texto)} className={`${classe(erros.texto)} w-full resize-none px-3.5 py-3`} />
                  <Erro>{erros.texto}</Erro>
                </div>
                <div>
                  <label htmlFor="pergunta-tipo" className="mb-1.5 block text-[14px] font-semibold">Tipo</label>
                  <div className="relative">
                    <select id="pergunta-tipo" value={p.tipo} onChange={(e) => mudar({ tipo: e.target.value })}
                      className={`${classe(false)} h-12 w-full cursor-pointer appearance-none pl-3.5 pr-9`}>
                      <option value="nucleo">Principal</option>
                      <option value="verificacao">Verificação</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-suave" aria-hidden="true" />
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-texto-suave">
                    As perguntas de verificação servem para confirmar respostas anteriores do aluno.
                  </p>
                </div>
                {p.tipo === "verificacao" && (
                  <div>
                    <label htmlFor="pergunta-confirma" className="mb-1.5 block text-[14px] font-semibold">Confirma a pergunta</label>
                    {editar && temPar && pergunta.par && (
                      <p className="mb-2 text-[13px] text-texto-suave">Agora confirma: “{curto(pergunta.par.texto)}”. Escolha outra só se quiser mudar.</p>
                    )}
                    <div className="relative">
                      <select id="pergunta-confirma" value={p.confirma} onChange={(e) => mudar({ confirma: e.target.value })}
                        aria-invalid={Boolean(erros.confirma)} className={`${classe(erros.confirma)} h-12 w-full cursor-pointer appearance-none pl-3.5 pr-9`}>
                        <option value="">{editar && temPar ? "Manter a pergunta actual" : "Escolha a pergunta principal"}</option>
                        {principais.filter((q) => q.id !== pergunta?.id).map((q) => (
                          <option key={q.id} value={q.id}>{q.numero}. {curto(q.texto, 60)}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-suave" aria-hidden="true" />
                    </div>
                    <Erro>{erros.confirma}</Erro>
                  </div>
                )}
              </section>

              <section className="mt-8 flex flex-col gap-4 border-t border-borda pt-7">
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-texto-suave">Opções de resposta</h3>
                <p className="-mt-2 text-[13px] leading-relaxed text-texto-suave">
                  Uma opção para cada perfil. Pode marcar no máximo uma como a resposta “certa” para a maioria dos alunos.
                </p>
                {ORDEM_PERFIS.map((perfil) => {
                  const cor = COR_PERFIL[perfil];
                  const erro = erros.opcoes?.[perfil];
                  const preenchido = Boolean(p.opcoes[perfil].trim());
                  const id = `opcao-${ORDEM_PERFIS.indexOf(perfil)}`;
                  return (
                    <div key={perfil} className={`rounded-[10px] border p-4 ${erro ? "border-[#c0392b]" : "border-borda"}`}
                      style={{ borderLeft: `4px solid ${erro ? "#c0392b" : cor}` }}>
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-[14px] font-semibold" style={{ color: cor }}>{perfil}</span>
                        {preenchido && <span className="rounded-[6px] bg-[#e7f4ec] px-2 py-0.5 text-[11px] font-semibold text-[#1e7a4f]">Preenchido</span>}
                      </div>
                      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold">Texto da opção</label>
                      <input id={id} value={p.opcoes[perfil]} maxLength={200}
                        onChange={(e) => mudar({ opcoes: { ...p.opcoes, [perfil]: e.target.value } })}
                        placeholder={`Escreva a opção associada ao perfil ${perfil}`}
                        aria-invalid={Boolean(erro)} className={`${classe(erro)} h-11 w-full px-3.5`} />
                      <Erro>{erro}</Erro>
                      <label className="mt-3 flex items-start gap-2.5 text-[13px] leading-snug">
                        <input type="checkbox" checked={p.certa === perfil}
                          onChange={(e) => mudar({ certa: e.target.checked ? perfil : "" })}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-primaria" />
                        <span>
                          Esta opção parece a resposta “certa” para a maioria dos alunos
                          <span className="mt-0.5 block text-[12px] text-texto-suave">
                            Se marcar, esta opção conta menos no resultado, porque muitos alunos a escolhem para parecer bem.
                          </span>
                        </span>
                      </label>
                    </div>
                  );
                })}
              </section>
              {erros.geral && <p role="alert" className="mt-6 rounded-[8px] bg-red-50 px-4 py-3 text-[14px] text-red-700">{erros.geral}</p>}
            </div>

            <div className="flex justify-end gap-3 border-t border-borda px-6 py-4">
              <button type="button" onClick={aoFechar} disabled={aGuardar}
                className="h-11 rounded-[8px] border-[1.5px] border-primaria px-5 text-[15px] font-semibold text-primaria hover:bg-primaria-clara">
                Cancelar
              </button>
              <button type="submit" disabled={aGuardar}
                className="flex h-11 items-center gap-2 rounded-[8px] bg-primaria px-5 text-[15px] font-semibold text-white hover:bg-primaria-escura disabled:opacity-70">
                {aGuardar && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {aGuardar ? "A guardar…" : editar ? "Guardar alterações" : "Guardar pergunta"}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
