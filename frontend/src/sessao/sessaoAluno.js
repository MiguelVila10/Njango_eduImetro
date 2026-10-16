// Sessão do aluno.
//
// O aluno não tem conta nem palavra-passe. Ao registar-se, o backend devolve
// um token assinado (token_sessao) que vale 24 horas e vai no cabeçalho
// X-Sessao-Aluno de cada pedido. Quem decide se o token ainda vale é sempre o
// servidor; a hora guardada aqui serve só para não mostrar ao aluno um
// teste que já expirou.

import { apagar, guardar, ler } from "./armazenamento";

const CHAVE = "njango.sessaoAluno";
export const DURACAO_MS = 24 * 60 * 60 * 1000;

let emMemoria = null; // usado quando o localStorage não está disponível

export function iniciarSessaoAluno({ id, nome, token_sessao }, agora = Date.now()) {
  emMemoria = { alunoId: id, nome, token: token_sessao, iniciadaEm: agora };
  guardar(CHAVE, emMemoria);
  return emMemoria;
}

export function sessaoAluno(agora = Date.now()) {
  const sessao = ler(CHAVE) ?? emMemoria;
  if (!sessao?.token) return null;
  if (agora - sessao.iniciadaEm >= DURACAO_MS) {
    terminarSessaoAluno();
    return null;
  }
  return sessao;
}

export function terminarSessaoAluno() {
  emMemoria = null;
  apagar(CHAVE);
}
