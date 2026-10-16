// Chamadas do percurso do aluno. Cada função corresponde a um endpoint.

import { pedido } from "./cliente";

// As 12 disciplinas obrigatórias, pela mesma ordem do backend
// (alunos/views.py → DISCIPLINAS_OBRIGATORIAS).
export const DISCIPLINAS = [
  "Português", "Matemática", "Física", "Química", "Biologia",
  "História", "Geografia", "Língua Estrangeira", "Educação Moral e Cívica",
  "Educação Física", "Educação Visual", "Educação Laboral",
];

export const NOTA_MIN = 10;
export const NOTA_MAX = 20;

/** Regista o aluno. Devolve { id, nome, idade, escola, token_sessao }. */
export function registarAluno({ nome, idade, escola }) {
  return pedido("/alunos/", { metodo: "POST", corpo: { nome, idade: Number(idade), escola } });
}

/** Notas já gravadas do aluno da sessão: [{ id, aluno, disciplina, nota }]. */
export function listarNotas() {
  return pedido("/notas-disciplina/", { auth: "aluno" });
}

export function criarNota(alunoId, disciplina, nota) {
  return pedido("/notas-disciplina/", {
    metodo: "POST", auth: "aluno", corpo: { aluno: alunoId, disciplina, nota: Number(nota) },
  });
}

export function alterarNota(notaId, nota) {
  return pedido(`/notas-disciplina/${notaId}/`, {
    metodo: "PATCH", auth: "aluno", corpo: { nota: Number(nota) },
  });
}

/** { completo: bool, faltam: [disciplina] } */
export function boletimCompleto(alunoId) {
  return pedido(`/alunos/${alunoId}/boletim-completo/`, { auth: "aluno" });
}

/**
 * Estado do teste e próxima pergunta:
 * { terminado, tentativa, respondidas, pode_repetir,
 *   item: { id, texto, opcoes: [{ opcao, texto, posicao }] } | null }
 */
export function proximaPergunta(alunoId) {
  return pedido(`/cat/proxima/${alunoId}/`, { auth: "aluno" });
}

/** opcao = número original da opção (0-3); posicao = letra no ecrã (A-D). */
export function responderPergunta({ alunoId, itemId, opcao, tempoMs, posicao }) {
  return pedido("/respostas-cat/", {
    metodo: "POST",
    auth: "aluno",
    corpo: {
      aluno: alunoId, item: itemId, opcao,
      tempo_resposta_ms: Math.max(0, Math.round(tempoMs)), posicao_ecra: posicao,
    },
  });
}

export function repetirTeste(alunoId) {
  return pedido(`/cat/repetir/${alunoId}/`, { metodo: "POST", auth: "aluno" });
}

/**
 * Corre o motor e devolve até 3 recomendações.
 * Erros com código: "sem_cursos_compativeis" (422, traz cursos_proximos)
 * e "escolha_ja_confirmada" (409).
 */
export function gerarRecomendacoes(alunoId) {
  return pedido(`/recomendacoes/gerar/${alunoId}/`, { metodo: "POST", auth: "aluno" });
}

export function listarRecomendacoes() {
  return pedido("/recomendacoes/", { auth: "aluno" });
}

/** A escolha é definitiva: escolher outra devolve 409. */
export function escolherCurso(recomendacaoId) {
  return pedido(`/recomendacoes/${recomendacaoId}/escolher/`, { metodo: "POST", auth: "aluno" });
}
