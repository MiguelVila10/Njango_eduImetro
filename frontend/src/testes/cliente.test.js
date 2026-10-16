import { describe, expect, it, vi } from "vitest";

import { ErroApi, EVENTO_SESSAO_EXPIRADA, mensagemDoErro, pedido } from "../api/cliente";
import { iniciarSessaoAluno, sessaoAluno } from "../sessao/sessaoAluno";
import { iniciarSessaoOrientador, sessaoOrientador } from "../sessao/sessaoOrientador";

function respostaFalsa(status, corpo) {
  return vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(corpo === undefined ? "" : JSON.stringify(corpo), { status }),
  );
}

describe("pedido()", () => {
  it("envia o token do aluno no cabeçalho X-Sessao-Aluno", async () => {
    iniciarSessaoAluno({ id: 7, nome: "Ana", token_sessao: "tok-aluno" });
    const espiao = respostaFalsa(200, []);
    await pedido("/notas-disciplina/", { auth: "aluno" });
    const [url, opcoes] = espiao.mock.calls[0];
    expect(url).toMatch(/\/api\/notas-disciplina\/$/);
    expect(opcoes.headers["X-Sessao-Aluno"]).toBe("tok-aluno");
    expect(opcoes.headers.Authorization).toBeUndefined();
  });

  it("envia o token do orientador em Authorization", async () => {
    iniciarSessaoOrientador({ token: "abc", username: "prof" });
    const espiao = respostaFalsa(200, {});
    await pedido("/painel/resumo/", { auth: "orientador" });
    expect(espiao.mock.calls[0][1].headers.Authorization).toBe("Token abc");
  });

  it("envia o corpo em JSON", async () => {
    const espiao = respostaFalsa(201, { id: 1 });
    const dados = await pedido("/alunos/", { metodo: "POST", corpo: { nome: "Ana" } });
    expect(dados).toEqual({ id: 1 });
    expect(espiao.mock.calls[0][1].body).toBe('{"nome":"Ana"}');
    expect(espiao.mock.calls[0][1].headers["Content-Type"]).toBe("application/json");
  });

  it("transforma o erro do backend em ErroApi com código e dados", async () => {
    respostaFalsa(422, { codigo: "sem_cursos_compativeis", erro: "Nenhum curso.", cursos_proximos: [] });
    const erro = await pedido("/recomendacoes/gerar/1/", { metodo: "POST", auth: "aluno" }).catch((e) => e);
    expect(erro).toBeInstanceOf(ErroApi);
    expect(erro.status).toBe(422);
    expect(erro.codigo).toBe("sem_cursos_compativeis");
    expect(erro.message).toBe("Nenhum curso.");
    expect(erro.dados.cursos_proximos).toEqual([]);
  });

  it("401 do aluno apaga a sessão e avisa a app", async () => {
    iniciarSessaoAluno({ id: 7, nome: "Ana", token_sessao: "velho" });
    respostaFalsa(401, { detail: "Não autenticado." });
    const ouvinte = vi.fn();
    window.addEventListener(EVENTO_SESSAO_EXPIRADA, ouvinte);
    await expect(pedido("/cat/proxima/7/", { auth: "aluno" })).rejects.toThrow("Não autenticado.");
    window.removeEventListener(EVENTO_SESSAO_EXPIRADA, ouvinte);
    expect(sessaoAluno()).toBeNull();
    expect(ouvinte.mock.calls[0][0].detail.tipo).toBe("aluno");
  });

  it("401 do orientador apaga só a sessão do orientador", async () => {
    iniciarSessaoOrientador({ token: "abc", username: "prof" });
    iniciarSessaoAluno({ id: 7, nome: "Ana", token_sessao: "t" });
    respostaFalsa(401, {});
    await pedido("/alunos/", { auth: "orientador" }).catch(() => {});
    expect(sessaoOrientador()).toBeNull();
    expect(sessaoAluno()).not.toBeNull();
  });

  it("sem rede dá uma mensagem clara", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
    const erro = await pedido("/alunos/").catch((e) => e);
    expect(erro.status).toBe(0);
    expect(erro.message).toMatch(/Sem ligação/);
  });
});

describe("mensagemDoErro()", () => {
  it("usa o primeiro erro de validação de campo do DRF", () => {
    expect(mensagemDoErro({ idade: ["A idade deve ser um valor positivo."] }, 400))
      .toBe("A idade deve ser um valor positivo.");
  });
  it("usa non_field_errors (login errado)", () => {
    expect(mensagemDoErro({ non_field_errors: ["Credenciais inválidas."] }, 400)).toBe("Credenciais inválidas.");
  });
  it("erro 500 sem corpo", () => {
    expect(mensagemDoErro(null, 500)).toMatch(/servidor/);
  });
});
