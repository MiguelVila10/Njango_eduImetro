// Boletim do aluno: carrega as notas já gravadas, valida e grava as 12.

import { useEffect, useState } from "react";

import {
  DISCIPLINAS, NOTA_MAX, NOTA_MIN, alterarNota, boletimCompleto, criarNota, listarNotas,
} from "../api/aluno";

/** Devolve a mensagem de erro de uma nota, ou null se estiver certa. */
export function validarNota(valor) {
  if (valor === "" || valor === null || valor === undefined) return "Escreve a nota.";
  const n = Number(valor);
  if (!Number.isInteger(n)) return "A nota tem de ser um número inteiro.";
  if (n < NOTA_MIN || n > NOTA_MAX) return `A nota vai de ${NOTA_MIN} a ${NOTA_MAX}.`;
  return null;
}

export function useNotas(alunoId) {
  const [notas, setNotas] = useState(() => Object.fromEntries(DISCIPLINAS.map((d) => [d, ""])));
  const [ids, setIds] = useState({}); // disciplina → id da nota já gravada
  const [erros, setErros] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [aGuardar, setAGuardar] = useState(false);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let ativo = true;
    listarNotas()
      .then((lista) => {
        if (!ativo) return;
        setNotas((atual) => {
          const novo = { ...atual };
          for (const n of lista) novo[n.disciplina] = String(n.nota);
          return novo;
        });
        setIds(Object.fromEntries(lista.map((n) => [n.disciplina, n.id])));
      })
      .catch((e) => ativo && setErro(e))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [alunoId]);

  function definirNota(disciplina, valor) {
    setNotas((n) => ({ ...n, [disciplina]: valor }));
    if (erros[disciplina]) setErros((e) => ({ ...e, [disciplina]: validarNota(valor) }));
  }

  /** Valida tudo e grava. Devolve true quando o boletim fica completo. */
  async function guardar() {
    const novosErros = {};
    for (const d of DISCIPLINAS) {
      const msg = validarNota(notas[d]);
      if (msg) novosErros[d] = msg;
    }
    setErros(novosErros);
    if (Object.keys(novosErros).length) return false;

    setAGuardar(true);
    setErro(null);
    try {
      const gravadas = await Promise.all(
        DISCIPLINAS.map((d) => (ids[d] ? alterarNota(ids[d], notas[d]) : criarNota(alunoId, d, notas[d]))),
      );
      setIds(Object.fromEntries(gravadas.map((n) => [n.disciplina, n.id])));
      const { completo } = await boletimCompleto(alunoId);
      return completo;
    } catch (e) {
      setErro(e);
      return false;
    } finally {
      setAGuardar(false);
    }
  }

  return { notas, erros, definirNota, guardar, carregando, aGuardar, erro };
}
