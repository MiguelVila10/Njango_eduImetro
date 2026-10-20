// Registo do aluno, com a Nzinga e o Kiala a reagir ao que o aluno escreve:
// pensam quando ele clica num campo, duvidam quando há um erro, ficam
// surpreendidos com valores fora do normal e contentes quando está certo.

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { registarAluno } from "../../api/aluno";
import Cabecalho from "../../componentes/Cabecalho";
import Passos from "../../componentes/Passos";
import Personagem, { A_PENSAR, CONTENTE, DUVIDA, SURPRESA } from "../../componentes/personagens/Personagem";
import { precarregar } from "../../componentes/personagens/imagens";
import { iniciarSessaoAluno } from "../../sessao/sessaoAluno";

const reduzirMovimento = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
const primeiroNome = (nome) => nome.trim().split(/\s+/)[0];

// Cada validação devolve null (vazio), [CONTENTE, frase] ou [erro, frase].
const CAMPOS = {
  nome: {
    pergunta: "Como te chamas?",
    validar(v) {
      v = v.trim();
      if (!v) return null;
      if (/[0-9]/.test(v)) return [DUVIDA, "Um nome não leva números. Escreve só letras."];
      if (v.length < 2) return [DUVIDA, "Esse nome é muito curto. Escreve o teu nome completo."];
      if (v.length > 60) return [SURPRESA, "Uau, que nome tão grande! Escreve só o primeiro e o último."];
      return [CONTENTE, `Prazer, ${primeiroNome(v)}!`];
    },
  },
  idade: {
    pergunta: "Quantos anos tens?",
    validar(v) {
      v = v.trim();
      if (!v) return null;
      if (!/^[0-9]+$/.test(v)) return [DUVIDA, "A idade leva só números. Por exemplo: 15."];
      const n = Number(v);
      if (n > 20) return [SURPRESA, `Uau, ${n} anos?! Na 9.ª classe costuma ser entre 13 e 17.`];
      if (n < 11) return [DUVIDA, `Hmm, ${n} anos? Na 9.ª classe costuma ser entre 13 e 17.`];
      return [CONTENTE, `${n} anos, boa idade para escolher!`];
    },
  },
  escola: {
    pergunta: "Em que escola andas?",
    validar(v) {
      v = v.trim();
      if (!v) return null;
      if (v.length < 3) return [DUVIDA, "Escreve o nome completo da tua escola."];
      return [CONTENTE, "Fixe! Já falta pouco."];
    },
  },
};
const RESPOSTA_KIALA = { [CONTENTE]: "Boa!", [A_PENSAR]: null, [DUVIDA]: "Tens a certeza?", [SURPRESA]: "A sério?!" };

const estaCerto = (r) => r && r[0] === CONTENTE;

export default function Registo() {
  const navegar = useNavigate();
  const nzinga = useRef(null);
  const kiala = useRef(null);
  const temporizadores = useRef({});
  const [valores, setValores] = useState({ nome: "", idade: "", escola: "" });
  const [tocados, setTocados] = useState({});
  const [aEnviar, setAEnviar] = useState(false);
  const [erroServidor, setErroServidor] = useState(null);

  const resultados = Object.fromEntries(Object.keys(CAMPOS).map((c) => [c, CAMPOS[c].validar(valores[c])]));
  const tudoCerto = Object.values(resultados).every(estaCerto);

  // Fala a dois: as duas personagens reagem ao mesmo tempo (sincronizadas).
  function falarADois(textoN, expN, falaN, textoK, expK, falaK) {
    clearTimeout(temporizadores.current.kiala);
    nzinga.current?.diz(textoN, expN, falaN);
    kiala.current?.diz(textoK, expK, falaK);
  }

  function reagir(campo, focou, novosValores = valores) {
    const r = CAMPOS[campo].validar(novosValores[campo]);
    const todos = Object.keys(CAMPOS).every((c) => estaCerto(CAMPOS[c].validar(novosValores[c])));
    if (!r) return falarADois(CAMPOS[campo].pergunta, A_PENSAR, false, null, A_PENSAR, false);
    if (estaCerto(r) && todos) {
      return falarADois(`Tudo pronto, ${primeiroNome(novosValores.nome)}! Toca em Continuar.`, CONTENTE, false, "Boa!", CONTENTE, false);
    }
    if (focou && estaCerto(r)) return falarADois(CAMPOS[campo].pergunta, A_PENSAR, false, null, A_PENSAR, false);
    return falarADois(r[1], r[0], false, RESPOSTA_KIALA[r[0]], r[0], false);
  }

  useEffect(() => {
    precarregar();
    const t = temporizadores.current;
    t.boasVindas = setTimeout(() => {
      nzinga.current?.diz("Olá! Bem-vindo ao Njango Edu. Eu sou a Nzinga.", CONTENTE, true);
      t.boasVindasK = setTimeout(
        () => kiala.current?.diz("E eu sou o Kiala. Vamos descobrir o teu curso?", CONTENTE, true),
        1900,
      );
    }, 500);
    return () => Object.values(t).forEach(clearTimeout);
  }, []);

  function aoFocar(campo) {
    clearTimeout(temporizadores.current.espera);
    temporizadores.current.espera = setTimeout(() => reagir(campo, true), 140);
  }

  function aoEscrever(campo, valor) {
    const novos = { ...valores, [campo]: valor };
    setValores(novos);
    setErroServidor(null);
    clearTimeout(temporizadores.current.espera);
    temporizadores.current.espera = setTimeout(() => reagir(campo, false, novos), reduzirMovimento() ? 0 : 480);
  }

  async function submeter(e) {
    e.preventDefault();
    setTocados({ nome: true, idade: true, escola: true });
    if (!tudoCerto || aEnviar) return;
    clearTimeout(temporizadores.current.espera);
    setAEnviar(true);
    try {
      const aluno = await registarAluno({
        nome: valores.nome.trim(), idade: valores.idade.trim(), escola: valores.escola.trim(),
      });
      iniciarSessaoAluno(aluno);
      const nome = primeiroNome(valores.nome);
      falarADois("Muito bem! Agora vamos às tuas notas.", CONTENTE, true, `Boa sorte, ${nome}!`, CONTENTE, true);
      temporizadores.current.seguir = setTimeout(() => navegar("/aluno/notas"), reduzirMovimento() ? 300 : 2200);
    } catch (err) {
      setErroServidor(err);
      setAEnviar(false);
      falarADois("Ups, não consegui guardar. Tenta outra vez.", DUVIDA, false, "Hmm…", DUVIDA, false);
    }
  }

  const campoClasse = (campo) => {
    const r = resultados[campo];
    const mostrarErro = r && !estaCerto(r) && (tocados[campo] || valores[campo]);
    if (mostrarErro) return "border-red-600 ring-4 ring-red-50";
    if (estaCerto(r)) return "border-emerald-600";
    return "border-borda focus:border-primaria focus:ring-4 focus:ring-primaria/15";
  };

  return (
    <div className="min-h-screen bg-fundo">
      <Cabecalho />
      <main className="mx-auto grid max-w-[1180px] grid-cols-1 gap-4 px-4 pb-10 pt-4 md:gap-6 md:pt-6 sm:px-5 md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        {/* Palco das personagens */}
        <section aria-label="Personagens Nzinga e Kiala" className="relative flex min-w-0 flex-col justify-center overflow-hidden rounded-[20px] bg-primaria-clara px-3 pb-1 pt-4 sm:px-5 md:pb-9 md:pt-7">
          <div className="grid grid-cols-2 items-end gap-2.5 sm:gap-4">
            <Personagem ref={nzinga} id="n" nome="Nzinga" />
            <Personagem ref={kiala} id="k" nome="Kiala" />
          </div>
        </section>

        {/* Formulário */}
        <form onSubmit={submeter} noValidate className="flex min-w-0 flex-col gap-5 rounded-[20px] bg-white p-6 shadow-[0_10px_28px_rgba(37,43,66,0.07)] md:p-8">
          <Passos atual={1} />
          <div>
            <h1 className="text-[26px] font-bold leading-tight md:text-[30px]">Vamos começar</h1>
            <p className="mt-1 text-texto-suave">Conta-nos só um pouco sobre ti. Não precisas de criar conta nem palavra-passe.</p>
          </div>

          {[
            ["nome", "O teu nome", "Ex.: Ana Kiluange", "text", "name", ""],
            ["idade", "A tua idade", "Ex.: 15", "text", "off", "max-w-[160px]"],
            ["escola", "A tua escola", "Ex.: Escola do I Ciclo n.º 1234", "text", "off", ""],
          ].map(([campo, rotulo, exemplo, tipo, auto, largura]) => {
            const r = resultados[campo];
            const erro = r && !estaCerto(r) && (tocados[campo] || valores[campo]) ? r[1] : null;
            return (
              <div key={campo} className="flex flex-col gap-1.5">
                <label htmlFor={campo} className="text-[15px] font-semibold">{rotulo}</label>
                <input
                  id={campo}
                  type={tipo}
                  inputMode={campo === "idade" ? "numeric" : undefined}
                  autoComplete={auto}
                  placeholder={exemplo}
                  value={valores[campo]}
                  onFocus={() => aoFocar(campo)}
                  onBlur={() => setTocados((t) => ({ ...t, [campo]: true }))}
                  onChange={(e) => aoEscrever(campo, e.target.value)}
                  aria-invalid={Boolean(erro)}
                  aria-describedby={erro ? `${campo}-erro` : undefined}
                  className={`h-14 w-full rounded-[10px] border-[1.5px] bg-white px-4 text-[17px] font-medium outline-none transition-[border-color,box-shadow] ${largura} ${campoClasse(campo)}`}
                />
                {erro && <p id={`${campo}-erro`} className="text-[14px] font-medium text-red-700">{erro}</p>}
              </div>
            );
          })}

          {erroServidor && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[14px] text-red-700">{erroServidor.message}</p>
          )}

          <button
            type="submit"
            disabled={!tudoCerto || aEnviar}
            className="h-14 rounded-[10px] bg-primaria text-[16px] font-bold text-white transition-[background-color,transform] hover:bg-primaria-escura active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-borda disabled:text-texto-suave"
          >
            {aEnviar ? "A guardar…" : "Continuar"}
          </button>
        </form>
      </main>
    </div>
  );
}
