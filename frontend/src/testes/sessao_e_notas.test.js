import { describe, expect, it } from "vitest";

import { validarNota } from "../hooks/useNotas";
import { DURACAO_MS, iniciarSessaoAluno, sessaoAluno } from "../sessao/sessaoAluno";

describe("sessão do aluno", () => {
  it("guarda id, nome e token", () => {
    iniciarSessaoAluno({ id: 3, nome: "Kiala", token_sessao: "t" }, 1000);
    expect(sessaoAluno(1000)).toMatchObject({ alunoId: 3, nome: "Kiala", token: "t" });
  });

  it("deixa de valer ao fim de 24 horas", () => {
    iniciarSessaoAluno({ id: 3, nome: "Kiala", token_sessao: "t" }, 0);
    expect(sessaoAluno(DURACAO_MS - 1)).not.toBeNull();
    expect(sessaoAluno(DURACAO_MS)).toBeNull();
    expect(sessaoAluno(0)).toBeNull(); // foi apagada
  });
});

describe("validarNota()", () => {
  it.each([["", "Escreve a nota."], ["9", "A nota vai de 10 a 20."], ["21", "A nota vai de 10 a 20."],
    ["14.5", "A nota tem de ser um número inteiro."]])("%s → erro", (valor, msg) => {
    expect(validarNota(valor)).toBe(msg);
  });
  it.each(["10", "15", "20"])("%s é válida", (valor) => {
    expect(validarNota(valor)).toBeNull();
  });
});
