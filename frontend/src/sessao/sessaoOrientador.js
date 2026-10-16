// Sessão do orientador: o token do DRF devolvido por /api/auth/login/.
// Vai no cabeçalho "Authorization: Token <token>".

import { apagar, guardar, ler } from "./armazenamento";

const CHAVE = "njango.sessaoOrientador";

let emMemoria = null;

export function iniciarSessaoOrientador({ token, username }) {
  emMemoria = { token, username };
  guardar(CHAVE, emMemoria);
  return emMemoria;
}

export function sessaoOrientador() {
  const sessao = ler(CHAVE) ?? emMemoria;
  return sessao?.token ? sessao : null;
}

export function terminarSessaoOrientador() {
  emMemoria = null;
  apagar(CHAVE);
}
