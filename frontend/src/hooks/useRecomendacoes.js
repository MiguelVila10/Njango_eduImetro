// Resultado do aluno: as 3 sugestões, o caso "nenhum curso compatível"
// e a escolha definitiva do curso.

import { useCallback, useEffect, useState } from "react";

import { escolherCurso, gerarRecomendacoes, listarRecomendacoes } from "../api/aluno";

// Um só pedido de cada vez por aluno: se o ecrã montar duas vezes (o React
// faz isso em desenvolvimento) ou o aluno recarregar a meio, reaproveita-se
// o pedido que já está a correr em vez de gerar as sugestões duas vezes.
const emCurso = new Map();

export function obterOuGerar(alunoId) {
  if (!emCurso.has(alunoId)) {
    const promessa = (async () => {
      const lista = await listarRecomendacoes();
      return lista.length ? lista : gerarRecomendacoes(alunoId);
    })().finally(() => emCurso.delete(alunoId));
    emCurso.set(alunoId, promessa);
  }
  return emCurso.get(alunoId);
}

export function useRecomendacoes(alunoId) {
  const [recomendacoes, setRecomendacoes] = useState([]);
  const [cursosProximos, setCursosProximos] = useState(null); // só quando nenhum curso é compatível
  const [carregando, setCarregando] = useState(true);
  const [aEscolher, setAEscolher] = useState(false);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      // Se já existem (o aluno voltou à página), mostram-se as mesmas;
      // só se corre o motor quando ainda não há nenhuma.
      const lista = await obterOuGerar(alunoId);
      setRecomendacoes([...lista].sort((a, b) => a.rank - b.rank));
    } catch (e) {
      if (e.codigo === "sem_cursos_compativeis") setCursosProximos(e.dados.cursos_proximos);
      else setErro(e);
    } finally {
      setCarregando(false);
    }
  }, [alunoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const escolhida = recomendacoes.find((r) => r.escolhida_pelo_aluno) ?? null;

  /** Confirma a escolha (definitiva). Devolve a recomendação escolhida ou null. */
  async function escolher(recomendacaoId) {
    setAEscolher(true);
    setErro(null);
    try {
      const rec = await escolherCurso(recomendacaoId);
      setRecomendacoes((lista) => lista.map((r) => (r.id === rec.id ? rec : r)));
      return rec;
    } catch (e) {
      // Já havia outra escolha (p. ex. noutro separador): mostra a que ficou.
      if (e.codigo === "escolha_ja_confirmada") await carregar();
      setErro(e);
      return null;
    } finally {
      setAEscolher(false);
    }
  }

  return { recomendacoes, cursosProximos, escolhida, carregando, aEscolher, erro, escolher };
}
