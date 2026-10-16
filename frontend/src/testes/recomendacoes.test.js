import { describe, expect, it, vi } from "vitest";

import { obterOuGerar } from "../hooks/useRecomendacoes";

describe("obterOuGerar()", () => {
  it("dois pedidos ao mesmo tempo geram as sugestões só uma vez", async () => {
    const espiao = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) =>
      new Response(JSON.stringify(String(url).includes("/gerar/") ? [{ id: 1, rank: 1 }] : []), { status: 200 }),
    );
    const [a, b] = await Promise.all([obterOuGerar(5), obterOuGerar(5)]);
    expect(a).toEqual(b);
    const gerar = espiao.mock.calls.filter(([url]) => String(url).includes("/gerar/"));
    expect(gerar).toHaveLength(1);
  });

  it("não gera quando as sugestões já existem", async () => {
    const espiao = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ id: 9, rank: 1 }]), { status: 200 }),
    );
    expect(await obterOuGerar(6)).toEqual([{ id: 9, rank: 1 }]);
    expect(espiao.mock.calls.some(([url]) => String(url).includes("/gerar/"))).toBe(false);
  });
});
