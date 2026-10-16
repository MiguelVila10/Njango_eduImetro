// Cliente HTTP único para falar com o backend Django.
//
// - "auth: 'aluno'" envia o cabeçalho X-Sessao-Aluno;
// - "auth: 'orientador'" envia Authorization: Token <token>;
// - sem auth, o pedido vai sem credenciais (registo do aluno, login).
//
// Erros chegam sempre como ErroApi, com a mensagem já pronta a mostrar.
// Um 401 significa que a sessão deixou de valer: a sessão é apagada e é
// lançado o evento "njango:sessao-expirada" para a app reagir.

import { sessaoAluno, terminarSessaoAluno } from "../sessao/sessaoAluno";
import { sessaoOrientador, terminarSessaoOrientador } from "../sessao/sessaoOrientador";

export const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000/api").replace(/\/$/, "");

export const EVENTO_SESSAO_EXPIRADA = "njango:sessao-expirada";

export class ErroApi extends Error {
  constructor({ status, mensagem, codigo = null, dados = null }) {
    super(mensagem);
    this.name = "ErroApi";
    this.status = status;
    this.codigo = codigo;
    this.dados = dados;
  }
}

// O DRF devolve erros em formatos diferentes; juntamos tudo numa frase.
export function mensagemDoErro(dados, status) {
  if (!dados) return mensagemPorEstado(status);
  if (typeof dados === "string") return dados;
  if (dados.erro) return dados.erro;
  if (dados.detail) return dados.detail;
  if (Array.isArray(dados.non_field_errors)) return dados.non_field_errors.join(" ");
  const primeiro = Object.values(dados).find((v) => Array.isArray(v) && typeof v[0] === "string");
  return primeiro ? primeiro[0] : mensagemPorEstado(status);
}

function mensagemPorEstado(status) {
  if (status === 0) return "Sem ligação ao servidor. Verifica a internet e tenta de novo.";
  if (status >= 500) return "O servidor teve um problema. Tenta de novo daqui a pouco.";
  return "Não foi possível concluir o pedido.";
}

function cabecalhos(auth, temCorpo) {
  const h = { Accept: "application/json" };
  if (temCorpo) h["Content-Type"] = "application/json";
  if (auth === "aluno") {
    const s = sessaoAluno();
    if (s) h["X-Sessao-Aluno"] = s.token;
  } else if (auth === "orientador") {
    const s = sessaoOrientador();
    if (s) h.Authorization = `Token ${s.token}`;
  }
  return h;
}

export async function pedido(caminho, { metodo = "GET", corpo, auth = null } = {}) {
  const temCorpo = corpo !== undefined;
  let resposta;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method: metodo,
      headers: cabecalhos(auth, temCorpo),
      body: temCorpo ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new ErroApi({ status: 0, mensagem: mensagemPorEstado(0) });
  }

  const texto = await resposta.text();
  let dados = null;
  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch {
      dados = null;
    }
  }

  if (resposta.ok) return dados;

  if (resposta.status === 401 && auth) {
    if (auth === "aluno") terminarSessaoAluno();
    else terminarSessaoOrientador();
    window.dispatchEvent(new CustomEvent(EVENTO_SESSAO_EXPIRADA, { detail: { tipo: auth } }));
  }

  throw new ErroApi({
    status: resposta.status,
    mensagem: mensagemDoErro(dados, resposta.status),
    codigo: dados?.codigo ?? null,
    dados,
  });
}
