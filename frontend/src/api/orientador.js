// Chamadas da área do orientador. Todas levam o token do orientador.

import { pedido } from "./cliente";

const comToken = (caminho, opcoes = {}) => pedido(caminho, { ...opcoes, auth: "orientador" });

/** Devolve { token }. Credenciais erradas → ErroApi 400. */
export function entrar(username, password) {
  return pedido("/auth/login/", { metodo: "POST", corpo: { username, password } });
}

export const painelResumo = () => comToken("/painel/resumo/");

// Alunos (só consulta)
export const listarAlunos = () => comToken("/alunos/");
export const fichaAluno = (id) => comToken(`/alunos/${id}/`);

// Catálogo de cursos
export const listarCursos = () => comToken("/cursos/");
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
