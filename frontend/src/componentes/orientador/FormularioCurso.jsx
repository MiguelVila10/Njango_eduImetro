// Painel lateral "Adicionar curso" / "Editar curso" (design "Njango Edu —
// Gestão de cursos", Frame B). Valida no ecrã com as mesmas regras do
// servidor (cursos/serializers.py) e mostra também os erros que o servidor
// devolver. RF12: o orientador adiciona e edita; não apaga.

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ChevronDown, LoaderCircle, Plus, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { DISCIPLINAS } from "../../api/aluno";
import { alterarCurso, criarCurso } from "../../api/orientador";
import { ORDEM_PERFIS } from "./pecas";

export const ESCOLAS = ["ITEL", "IPIL", "IMEL", "IMS", "CEARTE"];
const NOTA_FORA = "A nota tem de estar entre 10 e 20.";

const notaValida = (v) => /^\d{2}$/.test(String(v).trim()) && Number(v) >= 10 && Number(v) <= 20;

function estadoInicial(curso) {
  if (!curso) {
    return {
      nome: "", instituicao: "", arquetipo_dominante: "", descricao: "",
      prerequisitos: [{ disciplina: "", nota_min: "" }],
      notas_ideais: Object.fromEntries(DISCIPLINAS.map((d) => [d, ""])),
    };
  }
  const ideais = Object.fromEntries(DISCIPLINAS.map((d) => [d, ""]));
  for (const n of curso.notas_ideais ?? []) ideais[n.disciplina] = String(n.peso_ideal);
  return {
    nome: curso.nome, instituicao: curso.instituicao, arquetipo_dominante: curso.arquetipo_dominante,
    descricao: curso.descricao ?? "",
    prerequisitos: (curso.prerequisitos ?? []).length
      ? curso.prerequisitos.map((p) => ({ disciplina: p.disciplina, nota_min: String(p.nota_min) }))
      : [{ disciplina: "", nota_min: "" }],
    notas_ideais: ideais,
  };
}

function validar(c) {
  const e = { prerequisitos: {}, notas_ideais: {} };
  if ((c.nome.match(/\p{L}/gu) ?? []).length < 3) e.nome = "Indique o nome do curso.";
  if (!c.instituicao) e.instituicao = "Escolha a escola.";
  if (!c.arquetipo_dominante) e.arquetipo_dominante = "Escolha o perfil dominante.";

  const usadas = c.prerequisitos.map((p) => p.disciplina).filter(Boolean);
  c.prerequisitos.forEach((p, i) => {
    const erro = {};
    if (!p.disciplina) erro.disciplina = "Escolha a disciplina.";
    else if (usadas.indexOf(p.disciplina) !== i) erro.disciplina = "Esta disciplina já está na lista.";
    if (!notaValida(p.nota_min)) erro.nota_min = NOTA_FORA;
    if (Object.keys(erro).length) e.prerequisitos[i] = erro;
  });
  if (!c.prerequisitos.length) e.prerequisitosGeral = "Indique pelo menos um pré-requisito.";

  for (const d of DISCIPLINAS) if (!notaValida(c.notas_ideais[d])) e.notas_ideais[d] = NOTA_FORA;
  return e;
}

const temErros = (e) =>
  Object.keys(e).some((k) => (typeof e[k] === "object" ? Object.keys(e[k]).length > 0 : Boolean(e[k])));

function MensagemErro({ id, children }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-[#c0392b]">
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> {children}
    </p>
  );
}

const CAMPO = "rounded-[8px] border bg-white text-[15px] font-medium text-texto placeholder:font-normal placeholder:text-texto-suave/70 focus:outline-none focus:ring-4";
const classeCampo = (erro) => `${CAMPO} ${erro ? "border-2 border-[#c0392b] focus:ring-red-100" : "border-borda focus:border-primaria focus:ring-primaria/15"}`;

function Seleccao({ id, valor, aoMudar, erro, children, rotulo, className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <select id={id} value={valor} onChange={(e) => aoMudar(e.target.value)} aria-label={rotulo}
        aria-invalid={Boolean(erro)} aria-describedby={erro ? `${id}-erro` : undefined}
        className={`${classeCampo(erro)} h-12 w-full cursor-pointer appearance-none pl-3.5 pr-9`}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-texto-suave" aria-hidden="true" />
    </div>
  );
}

export default function FormularioCurso({ aberto, curso = null, aoFechar, aoGuardar }) {
  const editar = Boolean(curso);
  const [c, setC] = useState(() => estadoInicial(curso));
  const [erros, setErros] = useState({});
  const [tentou, setTentou] = useState(false);
  const [aGuardar, setAGuardar] = useState(false);
  const [erroGeral, setErroGeral] = useState(null);
  const painel = useRef(null);

  useEffect(() => {
    if (!aberto) return undefined;
    setC(estadoInicial(curso)); setErros({}); setTentou(false); setErroGeral(null);
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => painel.current?.querySelector("#curso-nome")?.focus(), 60);
    return () => { clearTimeout(t); document.body.style.overflow = antes; };
  }, [aberto, curso]);

  useEffect(() => {
    if (!aberto) return undefined;
    const tecla = (e) => e.key === "Escape" && !aGuardar && aoFechar();
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [aberto, aGuardar, aoFechar]);

  function mudar(alteracao) {
    const novo = { ...c, ...alteracao };
    setC(novo);
    if (tentou) setErros(validar(novo));
  }
  const mudarPre = (i, campo, valor) =>
    mudar({ prerequisitos: c.prerequisitos.map((p, j) => (j === i ? { ...p, [campo]: valor } : p)) });

  async function guardar(e) {
    e.preventDefault();
    setTentou(true); setErroGeral(null);
    const encontrados = validar(c);
    setErros(encontrados);
    if (temErros(encontrados)) {
      painel.current?.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }
    setAGuardar(true);
    const corpo = {
      nome: c.nome.trim(), instituicao: c.instituicao, arquetipo_dominante: c.arquetipo_dominante, descricao: c.descricao.trim(),
      prerequisitos: c.prerequisitos.map((p) => ({ disciplina: p.disciplina, nota_min: Number(p.nota_min) })),
      notas_ideais: DISCIPLINAS.map((d) => ({ disciplina: d, peso_ideal: Number(c.notas_ideais[d]) })),
    };
    try {
      const guardado = editar ? await alterarCurso(curso.id, corpo) : await criarCurso(corpo);
      aoGuardar(guardado);
    } catch (err) {
      const d = err.status === 400 && err.dados && typeof err.dados === "object" ? err.dados : null;
      if (d) {
        const doServidor = { prerequisitos: {}, notas_ideais: {} };
        for (const campo of ["nome", "instituicao", "arquetipo_dominante", "descricao"]) if (d[campo]) doServidor[campo] = [].concat(d[campo])[0];
        if (Array.isArray(d.prerequisitos)) {
          d.prerequisitos.forEach((p, i) => {
            if (typeof p === "string") doServidor.prerequisitosGeral = p;
            else if (p && Object.keys(p).length) doServidor.prerequisitos[i] = Object.fromEntries(Object.entries(p).map(([k, v]) => [k, [].concat(v)[0]]));
          });
        }
        if (Array.isArray(d.notas_ideais) && typeof d.notas_ideais[0] === "string") doServidor.notasGeral = d.notas_ideais[0];
        setErros(doServidor);
        if (!temErros(doServidor)) setErroGeral(err.message);
      } else {
        setErroGeral(err.message);
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
          <motion.form ref={painel} onSubmit={guardar} noValidate role="dialog" aria-modal="true" aria-labelledby="curso-titulo"
            className="flex h-full w-full max-w-[480px] flex-col bg-white shadow-[0_16px_36px_rgba(37,43,66,0.12)]"
            initial={{ x: 480 }} animate={{ x: 0 }} exit={{ x: 480 }} transition={{ type: "spring", stiffness: 380, damping: 40 }}>
            <div className="border-b border-borda px-6 pb-5 pt-6">
              <div className="flex items-start justify-between gap-3">
                <h2 id="curso-titulo" className="text-[24px] font-bold tracking-tight">{editar ? "Editar curso" : "Adicionar curso"}</h2>
                <button type="button" onClick={aoFechar} disabled={aGuardar} aria-label="Fechar painel"
                  className="-mr-2 -mt-1 flex h-10 w-10 items-center justify-center rounded-full text-texto-suave hover:bg-fundo">
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <p className="mt-2 text-[14px] font-medium leading-relaxed text-texto-suave">
                {editar
                  ? "As alterações contam para os próximos testes. As sugestões já feitas aos alunos não mudam."
                  : "O novo curso passa a poder ser sugerido aos alunos que fizerem o teste a partir de agora."}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <section className="flex flex-col gap-5">
                <h3 className="text-[16px] font-bold">Dados do curso</h3>
                <div>
                  <label htmlFor="curso-nome" className="mb-1.5 block text-[14px] font-semibold">Nome do curso</label>
                  <input id="curso-nome" value={c.nome} onChange={(e) => mudar({ nome: e.target.value })} maxLength={120}
                    placeholder="Ex.: Técnico de Mecânica Industrial" aria-invalid={Boolean(erros.nome)} aria-describedby={erros.nome ? "curso-nome-erro" : undefined}
                    className={`${classeCampo(erros.nome)} h-12 w-full px-3.5`} />
                  <MensagemErro id="curso-nome-erro">{erros.nome}</MensagemErro>
                </div>
                <div>
                  <label htmlFor="curso-escola" className="mb-1.5 block text-[14px] font-semibold">Escola</label>
                  <Seleccao id="curso-escola" valor={c.instituicao} aoMudar={(v) => mudar({ instituicao: v })} erro={erros.instituicao}>
                    <option value="">Selecione uma escola</option>
                    {ESCOLAS.map((e) => <option key={e} value={e}>{e}</option>)}
                  </Seleccao>
                  <MensagemErro id="curso-escola-erro">{erros.instituicao}</MensagemErro>
                </div>
                <div>
                  <label htmlFor="curso-perfil" className="mb-1.5 block text-[14px] font-semibold">Perfil dominante</label>
                  <Seleccao id="curso-perfil" valor={c.arquetipo_dominante} aoMudar={(v) => mudar({ arquetipo_dominante: v })} erro={erros.arquetipo_dominante}>
                    <option value="">Selecione o perfil dominante</option>
                    {ORDEM_PERFIS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </Seleccao>
                  <MensagemErro id="curso-perfil-erro">{erros.arquetipo_dominante}</MensagemErro>
                </div>
                <div>
                  <label htmlFor="curso-descricao" className="mb-1.5 block text-[14px] font-semibold">Descrição curta (opcional)</label>
                  <textarea id="curso-descricao" rows={3} value={c.descricao} onChange={(e) => mudar({ descricao: e.target.value })} maxLength={400}
                    placeholder="Em linguagem simples, para o aluno: o que se aprende e onde se pode trabalhar."
                    className={`${classeCampo(erros.descricao)} w-full resize-none px-3.5 py-3`} />
                  <MensagemErro id="curso-descricao-erro">{erros.descricao}</MensagemErro>
                </div>
              </section>

              <section className="mt-8 flex flex-col gap-3 border-t border-borda pt-7">
                <h3 className="text-[16px] font-bold">Pré-requisitos</h3>
                <p className="text-[14px] font-medium leading-relaxed text-texto-suave">
                  O curso só é sugerido a alunos que tenham pelo menos esta nota em cada disciplina indicada.
                </p>
                {c.prerequisitos.map((p, i) => {
                  const erro = erros.prerequisitos?.[i] ?? {};
                  return (
                    <div key={i}>
                      <div className="flex items-start gap-2">
                        <Seleccao id={`pre-disc-${i}`} rotulo={`Disciplina do pré-requisito ${i + 1}`} className="min-w-0 flex-1"
                          valor={p.disciplina} aoMudar={(v) => mudarPre(i, "disciplina", v)} erro={erro.disciplina}>
                          <option value="">Disciplina</option>
                          {DISCIPLINAS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </Seleccao>
                        <input aria-label={`Nota mínima do pré-requisito ${i + 1}`} inputMode="numeric" maxLength={2} placeholder="10–20"
                          value={p.nota_min} onChange={(e) => mudarPre(i, "nota_min", e.target.value.replace(/\D/g, ""))}
                          aria-invalid={Boolean(erro.nota_min)} className={`${classeCampo(erro.nota_min)} h-12 w-[92px] shrink-0 text-center tabular-nums`} />
                        <button type="button" onClick={() => mudar({ prerequisitos: c.prerequisitos.filter((_, j) => j !== i) })}
                          aria-label={`Remover o pré-requisito ${i + 1}`} disabled={c.prerequisitos.length === 1}
                          className="flex h-12 w-10 shrink-0 items-center justify-center rounded-[8px] text-texto-suave hover:bg-red-50 hover:text-red-700 disabled:invisible">
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                      <MensagemErro>{erro.disciplina ?? erro.nota_min}</MensagemErro>
                    </div>
                  );
                })}
                <MensagemErro>{erros.prerequisitosGeral}</MensagemErro>
                {c.prerequisitos.length < DISCIPLINAS.length && (
                  <button type="button" onClick={() => mudar({ prerequisitos: [...c.prerequisitos, { disciplina: "", nota_min: "" }] })}
                    className="flex items-center gap-2 self-start text-[14px] font-semibold text-primaria hover:underline">
                    <Plus className="h-4 w-4" aria-hidden="true" /> Adicionar outro pré-requisito
                  </button>
                )}
              </section>

              <section className="mt-8 flex flex-col gap-3 border-t border-borda pt-7">
                <h3 className="text-[16px] font-bold">Notas ideais</h3>
                <p className="text-[14px] font-medium leading-relaxed text-texto-suave">
                  Indique, de 10 a 20, a nota ideal em cada disciplina para este curso. Serve para comparar o curso com as notas do aluno.
                </p>
                <MensagemErro>{erros.notasGeral}</MensagemErro>
                <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                  {DISCIPLINAS.map((d) => {
                    const erro = erros.notas_ideais?.[d];
                    const id = `ideal-${DISCIPLINAS.indexOf(d)}`;
                    return (
                      <div key={d}>
                        <div className="flex items-center justify-between gap-2">
                          <label htmlFor={id} className="truncate text-[13px] font-medium" title={d}>{d}</label>
                          <input id={id} inputMode="numeric" maxLength={2} placeholder="—" value={c.notas_ideais[d]}
                            onChange={(e) => mudar({ notas_ideais: { ...c.notas_ideais, [d]: e.target.value.replace(/\D/g, "") } })}
                            aria-invalid={Boolean(erro)} className={`${classeCampo(erro)} h-11 w-[68px] shrink-0 text-center tabular-nums`} />
                        </div>
                        {erro && <p className="mt-1 text-right text-[12px] font-medium text-[#c0392b]">10 a 20</p>}
                      </div>
                    );
                  })}
                </div>
              </section>
              {erroGeral && <p role="alert" className="mt-6 rounded-[8px] bg-red-50 px-4 py-3 text-[14px] text-red-700">{erroGeral}</p>}
            </div>

            <div className="flex justify-end gap-3 border-t border-borda px-6 py-4">
              <button type="button" onClick={aoFechar} disabled={aGuardar}
                className="h-11 rounded-[8px] border-[1.5px] border-primaria px-5 text-[15px] font-semibold text-primaria hover:bg-primaria-clara">
                Cancelar
              </button>
              <button type="submit" disabled={aGuardar}
                className="flex h-11 items-center gap-2 rounded-[8px] bg-primaria px-5 text-[15px] font-semibold text-white hover:bg-primaria-escura disabled:opacity-70">
                {aGuardar && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {aGuardar ? "A guardar…" : editar ? "Guardar alterações" : "Guardar curso"}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
