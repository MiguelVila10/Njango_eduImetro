// Chamadas da área do orientador. Todas levam o token do orientador.

import { pedido } from "./cliente";

const comToken = (caminho, opcoes = {}) => pedido(caminho, { ...opcoes, auth: "orientador" });

/**
 * Entra com e-mail (ou nome de utilizador das contas antigas) e palavra-passe.
 * Devolve { token, nome, email }. Credenciais erradas → ErroApi 400;
 * conta ainda não aprovada → ErroApi 403 com codigo "conta_pendente".
 */
export function entrar(email, password) {
  return pedido("/auth/login/", { metodo: "POST", corpo: { email, password } });
}

/**
 * Pede uma conta nova de orientador. A conta fica pendente até um
 * administrador a aprovar. Erros de validação vêm em ErroApi.dados (por campo).
 */
export function pedirConta({ nome, email, escola, password, confirmarPassword, aceitaTermos }) {
  return pedido("/orientadores/registo/", {
    metodo: "POST",
    corpo: { nome, email, escola, password, confirmar_password: confirmarPassword, aceita_termos: aceitaTermos },
  });
}

/** Pede o link para criar uma palavra-passe nova (responde igual exista ou não a conta). */
export function pedirRecuperacao(email) {
  return pedido("/auth/recuperar/", { metodo: "POST", corpo: { email } });
}

/** Verifica se o link do e-mail ainda vale (ErroApi 400 com codigo "link_invalido" se não). */
export function verificarLinkNovaSenha(uid, token) {
  const q = new URLSearchParams({ uid, token });
  return pedido(`/auth/nova-senha/?${q}`);
}

/** Define a palavra-passe nova a partir do link do e-mail. */
export function definirNovaSenha({ uid, token, password, confirmarPassword }) {
  return pedido("/auth/nova-senha/", {
    metodo: "POST",
    corpo: { uid, token, password, confirmar_password: confirmarPassword },
  });
}

// Pedidos de conta (só o administrador)
/** Termina a sessão no servidor (o token deixa de funcionar). */
export const sairDaConta = () => comToken("/auth/sair/", { metodo: "POST" });

export const listarPedidosConta = () => comToken("/orientadores/pedidos/");
export const decidirPedidoConta = (id, decisao) => comToken(`/orientadores/pedidos/${id}/${decisao}/`, { metodo: "POST" });

export const painelResumo = () => comToken("/painel/resumo/");

// Alunos (só consulta)
export const listarAlunos = () => comToken("/alunos/");
export const fichaAluno = (id) => comToken(`/alunos/${id}/`);

// Catálogo de cursos
export const listarCursos = () => comToken("/cursos/");
export const obterCurso = (id) => comToken(`/cursos/${id}/`);
export const criarCurso = (dados) => comToken("/cursos/", { metodo: "POST", corpo: dados });
export const alterarCurso = (id, dados) => comToken(`/cursos/${id}/`, { metodo: "PATCH", corpo: dados });
export const listarPreRequisitos = () => comToken("/prerequisitos/");
export const criarPreRequisito = (dados) => comToken("/prerequisitos/", { metodo: "POST", corpo: dados });
export const listarVetoresIdeais = () => comToken("/vetores-ideais/");
export const criarVetorIdeal = (dados) => comToken("/vetores-ideais/", { metodo: "POST", corpo: dados });

// Banco de perguntas (não se apaga: desactiva-se com ativo=false)
export const listarPerguntas = () => comToken("/itens-cat/");
export const criarPergunta = (dados) => comToken("/itens-cat/", { metodo: "POST", corpo: dados });
export const alterarPergunta = (id, dados) => comToken(`/itens-cat/${id}/`, { metodo: "PATCH", corpo: dados });
