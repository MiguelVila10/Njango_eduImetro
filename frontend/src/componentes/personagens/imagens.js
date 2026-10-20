// Imagens das expressões (0 contente, 1 a pensar, 2 dúvida, 3 surpresa, 4 a falar)
// e pequenos acertos de posição para as caras ficarem alinhadas entre si.

import k0 from "../../assets/personagens/k0.webp";
import k1 from "../../assets/personagens/k1.webp";
import k2 from "../../assets/personagens/k2.webp";
import k3 from "../../assets/personagens/k3.webp";
import k4 from "../../assets/personagens/k4.webp";
import n0 from "../../assets/personagens/n0.webp";
import n1 from "../../assets/personagens/n1.webp";
import n2 from "../../assets/personagens/n2.webp";
import n3 from "../../assets/personagens/n3.webp";
import n4 from "../../assets/personagens/n4.webp";

export const IMAGENS = { n0, n1, n2, n3, n4, k0, k1, k2, k3, k4 };

// Desvios medidos na folha original (em píxeis de uma imagem de 210×285).
const DESVIOS = {
  n0: [0, 0], n1: [0, 0], n2: [7, 0], n3: [-2, -1], n4: [2, 4],
  k0: [0, 0], k1: [18, -5], k2: [10, 0], k3: [3, 1], k4: [4, 0],
};

export function posicao(chave) {
  const [dx, dy] = DESVIOS[chave] ?? [0, 0];
  const x = Math.max(-10, Math.min(10, dx));
  const y = Math.max(-8, Math.min(8, dy));
  return `translate(${((x / 210) * 100).toFixed(2)}%,${((y / 285) * 100).toFixed(2)}%)`;
}

// Pré-carrega todas as expressões para a primeira troca não piscar.
export function precarregar() {
  Object.values(IMAGENS).forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}
