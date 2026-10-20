// Palco com a Nzinga e o Kiala, partilhado pelos ecrãs do aluno.
// usePersonagens() devolve as refs e a função falar(), que põe as duas
// personagens a reagir ao mesmo tempo.

import { useCallback, useEffect, useRef } from "react";

import Personagem from "./Personagem";
import { precarregar } from "./imagens";

export function usePersonagens() {
  const nzinga = useRef(null);
  const kiala = useRef(null);

  useEffect(() => {
    precarregar();
  }, []);

  /** Ambas ao mesmo tempo. Texto null = três pontinhos "a pensar". */
  const falar = useCallback((textoN, expN, falaN, textoK, expK, falaK) => {
    nzinga.current?.diz(textoN, expN, falaN);
    kiala.current?.diz(textoK, expK, falaK);
  }, []);

  return { nzinga, kiala, falar };
}

export default function Palco({ nzinga, kiala }) {
  return (
    <section
      aria-label="Personagens Nzinga e Kiala"
      className="relative flex min-w-0 flex-col justify-center overflow-hidden rounded-[20px] bg-primaria-clara px-3 pb-1 pt-4 sm:px-5 md:sticky md:top-24 md:self-start md:pb-9 md:pt-7"
    >
      <div className="grid grid-cols-2 items-end gap-2.5 sm:gap-4">
        <Personagem ref={nzinga} id="n" nome="Nzinga" />
        <Personagem ref={kiala} id="k" nome="Kiala" />
      </div>
    </section>
  );
}
