import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PainelRepetir } from "../paginas/aluno/Teste";

describe("PainelRepetir (confiança baixa no fim do teste)", () => {
  it("mostra as duas opções e chama a função certa", () => {
    const aoRecomecar = vi.fn();
    const aoContinuar = vi.fn();
    render(<PainelRepetir aRepetir={false} erro={null} aoRecomecar={aoRecomecar} aoContinuar={aoContinuar} />);

    expect(screen.getByRole("dialog", { name: "Queres fazer o teste outra vez?" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Recomeçar o teste/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continuar para os cursos" }));
    expect(aoRecomecar).toHaveBeenCalledTimes(1);
    expect(aoContinuar).toHaveBeenCalledTimes(1);
  });

  it("enquanto recomeça, os botões ficam desactivados", () => {
    render(<PainelRepetir aRepetir erro={null} aoRecomecar={() => {}} aoContinuar={() => {}} />);
    expect(screen.getByRole("button", { name: /A recomeçar/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Continuar para os cursos" })).toBeDisabled();
  });

  it("avisa quando não foi possível recomeçar", () => {
    render(<PainelRepetir aRepetir={false} erro={new Error("rede")} aoRecomecar={() => {}} aoContinuar={() => {}} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Não foi possível recomeçar o teste");
  });
});
