// Carrega dados de uma função assíncrona e devolve { dados, erro, carregando, recarregar }.
// Ignora respostas que chegam depois de o componente sair do ecrã.

import { useCallback, useEffect, useRef, useState } from "react";

export function useCarregar(funcao, dependencias = []) {
  const [estado, setEstado] = useState({ dados: null, erro: null, carregando: true });
  const pedidoAtual = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const executar = useCallback(funcao, dependencias);

  const recarregar = useCallback(async () => {
    const id = ++pedidoAtual.current;
    setEstado((e) => ({ ...e, erro: null, carregando: true }));
    try {
      const dados = await executar();
      if (id === pedidoAtual.current) setEstado({ dados, erro: null, carregando: false });
    } catch (erro) {
      if (id === pedidoAtual.current) setEstado({ dados: null, erro, carregando: false });
    }
  }, [executar]);

  useEffect(() => {
    recarregar();
    return () => {
      pedidoAtual.current++;
    };
  }, [recarregar]);

  return { ...estado, recarregar };
}
