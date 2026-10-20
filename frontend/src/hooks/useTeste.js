// Teste adaptativo (CAT): pede a próxima pergunta, mede o tempo de resposta
// e envia a opção escolhida. O servidor decide quando o teste termina.

import { useCallback, useEffect, useRef, useState } from "react";

import { proximaPergunta, repetirTeste, responderPergunta } from "../api/aluno";

export function useTeste(alunoId) {
  const [estado, setEstado] = useState(null); // resposta de /cat/proxima/
  const [carregando, setCarregando] = useState(true);
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState(null);
  const mostradaEm = useRef(0); // quando a pergunta actual apareceu
  const guardada = useRef(null); // id da última pergunta cuja resposta o servidor aceitou

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      setEstado(await proximaPergunta(alunoId));
    } catch (e) {
      setErro(e);
    } finally {
      setCarregando(false);
    }
  }, [alunoId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // O cronómetro começa quando a pergunta chega ao ecrã.
  useEffect(() => {
    if (estado?.item) mostradaEm.current = performance.now();
  }, [estado?.item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Milissegundos desde que a pergunta actual apareceu no ecrã. */
  const tempoDecorrido = useCallback(() => performance.now() - mostradaEm.current, []);

  /**
   * opcao: um elemento de estado.item.opcoes ({ opcao, texto, posicao }).
   * tempoMs: tempo até o aluno decidir (por defeito, até agora). O ecrã do
   * teste passa o momento em que a opção foi escolhida, sem contar o toque
   * no botão "Seguinte".
   */
  async function responder(opcao, tempoMs = tempoDecorrido()) {
    if (!estado?.item || aEnviar) return;
    setAEnviar(true);
    setErro(null);
    try {
      // Se a resposta já foi guardada e só falhou o pedido da pergunta
      // seguinte, "tentar de novo" não volta a enviar a mesma resposta.
      if (guardada.current !== estado.item.id) {
        await responderPergunta({
          alunoId,
          itemId: estado.item.id,
          opcao: opcao.opcao,
          posicao: opcao.posicao,
          tempoMs,
        });
        guardada.current = estado.item.id;
      }
      setEstado(await proximaPergunta(alunoId));
    } catch (e) {
      setErro(e);
    } finally {
      setAEnviar(false);
    }
  }

  /** Só é permitido uma vez, quando estado.pode_repetir for true. */
  async function repetir() {
    setAEnviar(true);
    setErro(null);
    try {
      guardada.current = null; // na 2.ª tentativa as perguntas podem repetir-se
      setEstado(await repetirTeste(alunoId));
    } catch (e) {
      setErro(e);
    } finally {
      setAEnviar(false);
    }
  }

  return { estado, carregando, aEnviar, erro, responder, repetir, recarregar: carregar, tempoDecorrido };
}
