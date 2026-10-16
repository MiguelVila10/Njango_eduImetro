// Acesso ao localStorage protegido: em modo privado ou com o armazenamento
// bloqueado, o browser pode lançar erro. Nesse caso a app continua a
// funcionar, só não guarda a sessão entre recarregamentos.

export function ler(chave) {
  try {
    const valor = window.localStorage.getItem(chave);
    return valor ? JSON.parse(valor) : null;
  } catch {
    return null;
  }
}

export function guardar(chave, valor) {
  try {
    window.localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    /* sem armazenamento: a sessão dura só enquanto a página estiver aberta */
  }
}

export function apagar(chave) {
  try {
    window.localStorage.removeItem(chave);
  } catch {
    /* nada a fazer */
  }
}
