// Personagem animada (Nzinga ou Kiala): troca de expressão rápida e suave,
// respiração e balanço, balão que escreve letra a letra e um leve movimento
// da cabeça enquanto "fala". Baseado no protótipo de animação aprovado.
//
// Controla-se por ref:  ref.current.diz(texto, expressao, fala)
//   texto: string, ou null para mostrar os três pontinhos "a pensar"
//   expressao: CONTENTE | A_PENSAR | DUVIDA | SURPRESA | A_FALAR
//   fala: true para mostrar a expressão "a falar" enquanto o texto aparece

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

import "./personagens.css";
import { IMAGENS, posicao } from "./imagens";

export const CONTENTE = 0;
export const A_PENSAR = 1;
export const DUVIDA = 2;
export const SURPRESA = 3;
export const A_FALAR = 4;

const aleatorio = (a, b) => a + Math.random() * (b - a);
const reduzirMovimento = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

const Personagem = forwardRef(function Personagem({ id, nome }, ref) {
  const caraRef = useRef(null);
  const imgA = useRef(null);
  const balaoRef = useRef(null);
  const estado = useRef({ expressao: CONTENTE, texto: undefined, timers: [], troca: null });

  useEffect(() => {
    const s = estado.current;
    return () => {
      s.timers.forEach(clearTimeout);
      clearTimeout(s.troca);
    };
  }, []);

  useImperativeHandle(ref, () => {
    const s = estado.current;
    function limpar() {
      s.timers.forEach(clearTimeout);
      s.timers = [];
      caraRef.current?.classList.remove("fala");
    }
    const depois = (fn, ms) => s.timers.push(setTimeout(fn, ms));

    function mudar(e, mexe) {
      const cara = caraRef.current;
      const img = imgA.current;
      if (e === s.expressao || !cara || !img) return;
      s.expressao = e;
      const chave = id + e;
      if (reduzirMovimento()) {
        img.src = IMAGENS[chave];
        img.style.transform = posicao(chave);
        return;
      }
      // Encolhe ligeiramente, troca o desenho a meio e volta ao tamanho.
      cara.classList.remove("a-trocar");
      void cara.offsetWidth;
      cara.classList.add("a-trocar");
      clearTimeout(s.troca);
      s.troca = setTimeout(() => {
        img.src = IMAGENS[chave];
        img.style.transform = posicao(chave);
      }, 90);
      if (mexe) {
        cara.style.setProperty("--inc", `${(Math.random() < 0.5 ? -1 : 1) * aleatorio(0.6, 1.4)}deg`);
        cara.classList.remove("mexe");
        void cara.offsetWidth;
        cara.classList.add("mexe");
      }
    }

    function diz(texto, e = CONTENTE, fala = false) {
      const balao = balaoRef.current;
      if (!balao) return;
      if (texto === s.texto) {
        mudar(e, false);
        return;
      }
      s.texto = texto;
      limpar();
      if (texto === null) {
        balao.innerHTML = '<span class="txt"><span class="digita" aria-label="a pensar"><i></i><i></i><i></i></span></span>';
        mudar(e, true);
        return;
      }
      const span = document.createElement("span");
      span.className = "txt";
      balao.replaceChildren(span);
      balao.classList.remove("entra");
      void balao.offsetWidth;
      balao.classList.add("entra");
      if (reduzirMovimento()) {
        span.textContent = texto;
        mudar(e, false);
        return;
      }
      let i = 0;
      if (fala) {
        // Uma só troca para "a falar" (sem abrir e fechar a boca a toda a
        // hora, que com estes desenhos fazia a cabeça saltar).
        mudar(A_FALAR, true);
        caraRef.current.classList.add("fala");
      } else {
        mudar(e, true);
      }
      const passo = () => {
        i += 1;
        span.textContent = texto.slice(0, i);
        if (i < texto.length) {
          const c = texto[i - 1];
          depois(passo, /[.!?…]/.test(c) ? aleatorio(260, 360) : c === "," ? aleatorio(140, 200) : aleatorio(22, 42));
        } else if (fala) {
          depois(() => {
            caraRef.current?.classList.remove("fala");
            mudar(e, true);
          }, 160);
        }
      };
      passo();
    }

    return { diz };
  }, [id]);

  return (
    <div className={`flex min-w-0 flex-col items-center gap-2 md:gap-3 pers-${id}`}>
      <div ref={balaoRef} className="balao-pers" aria-live="polite" />
      <div ref={caraRef} className="cara-pers">
        <div className="respira">
          <div className="balanco">
            <div className="reage">
              <div className="troca">
                <div className="fala-anim">
                  <img ref={imgA} src={IMAGENS[`${id}0`]} style={{ transform: posicao(`${id}0`) }} alt={nome} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="-mt-1.5 pb-2 text-[11px] font-bold uppercase tracking-[0.06em] text-primaria-escura md:pb-5 md:text-[13px]">{nome}</p>
    </div>
  );
});

export default Personagem;
