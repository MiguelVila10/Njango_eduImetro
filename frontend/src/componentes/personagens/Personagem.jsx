// Personagem animada (Nzinga ou Kiala): troca de expressão por esbatimento,
// respiração e balanço suaves, balão que escreve letra a letra e boca que
// mexe enquanto "fala". Portado do protótipo de animação aprovado.
//
// Controla-se por ref:  ref.current.diz(texto, expressao, fala)
//   texto: string, ou null para mostrar os três pontinhos "a pensar"
//   expressao: CONTENTE | A_PENSAR | DUVIDA | SURPRESA | A_FALAR
//   fala: true para mexer a boca enquanto o texto aparece

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
  const imgB = useRef(null);
  const balaoRef = useRef(null);
  const estado = useRef({ visivel: 0, expressao: CONTENTE, texto: undefined, timers: [] });

  useEffect(() => {
    const timers = estado.current.timers;
    return () => timers.forEach(clearTimeout);
  }, []);

  useImperativeHandle(ref, () => {
    const s = estado.current;
    const imgs = () => [imgA.current, imgB.current];

    function limpar() {
      s.timers.forEach(clearTimeout);
      s.timers = [];
      caraRef.current?.classList.remove("fala");
    }
    const depois = (fn, ms) => s.timers.push(setTimeout(fn, ms));

    function mudar(e, mexe) {
      if (e === s.expressao || !caraRef.current) return;
      s.expressao = e;
      const [a, b] = imgs();
      const frente = s.visivel === 0 ? a : b;
      const tras = s.visivel === 0 ? b : a;
      const chave = id + e;
      tras.src = IMAGENS[chave];
      if (reduzirMovimento()) {
        frente.src = tras.src;
        frente.style.transform = posicao(chave);
        return;
      }
      tras.style.transform = `${posicao(chave)} scale(1.01)`;
      requestAnimationFrame(() => {
        tras.style.opacity = 1;
        tras.style.transform = posicao(chave);
        frente.style.opacity = 0;
      });
      s.visivel = 1 - s.visivel;
      if (mexe) {
        const cara = caraRef.current;
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
        caraRef.current.classList.add("fala");
        const boca = (aberta) => {
          mudar(aberta ? A_FALAR : CONTENTE, false);
          depois(() => {
            if (caraRef.current?.classList.contains("fala")) boca(!aberta);
          }, aberta ? aleatorio(150, 260) : aleatorio(110, 200));
        };
        boca(true);
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
    <div className={`flex min-w-0 flex-col items-center gap-3 pers-${id}`}>
      <div ref={balaoRef} className="balao-pers" aria-live="polite" />
      <div ref={caraRef} className="cara-pers">
        <div className="respira">
          <div className="balanco">
            <div className="reage">
              <img ref={imgA} src={IMAGENS[`${id}0`]} style={{ transform: posicao(`${id}0`) }} alt={nome} />
              <img ref={imgB} alt="" style={{ opacity: 0 }} />
            </div>
          </div>
        </div>
      </div>
      <p className="-mt-1.5 pb-5 text-[13px] font-bold uppercase tracking-[0.06em] text-primaria-escura">{nome}</p>
    </div>
  );
});

export default Personagem;
