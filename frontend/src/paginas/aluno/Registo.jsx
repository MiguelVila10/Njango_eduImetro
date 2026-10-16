import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { registarAluno } from "../../api/aluno";
import { Botao, Campo, EcraProvisorio, MensagemErro } from "../../componentes/base";
import { iniciarSessaoAluno } from "../../sessao/sessaoAluno";

function validar({ nome, idade, escola }) {
  const erros = {};
  if (nome.trim().length < 2) erros.nome = "Escreve o teu nome.";
  const n = Number(idade);
  if (!Number.isInteger(n) || n < 10 || n > 25) erros.idade = "Escreve a tua idade (entre 10 e 25).";
  if (escola.trim().length < 2) erros.escola = "Escreve o nome da tua escola.";
  return erros;
}

export default function Registo() {
  const navegar = useNavigate();
  const [dados, setDados] = useState({ nome: "", idade: "", escola: "" });
  const [erros, setErros] = useState({});
  const [erro, setErro] = useState(null);
  const [aEnviar, setAEnviar] = useState(false);

  const mudar = (campo) => (e) => setDados((d) => ({ ...d, [campo]: e.target.value }));

  async function submeter(e) {
    e.preventDefault();
    const encontrados = validar(dados);
    setErros(encontrados);
    if (Object.keys(encontrados).length) return;
    setAEnviar(true);
    setErro(null);
    try {
      const aluno = await registarAluno({ ...dados, nome: dados.nome.trim(), escola: dados.escola.trim() });
      iniciarSessaoAluno(aluno);
      navegar("/aluno/notas");
    } catch (err) {
      setErro(err);
    } finally {
      setAEnviar(false);
    }
  }

  return (
    <EcraProvisorio titulo="Os teus dados">
      <form onSubmit={submeter} noValidate className="space-y-4">
        <Campo id="nome" rotulo="Nome" value={dados.nome} onChange={mudar("nome")} erro={erros.nome} autoComplete="name" />
        <Campo id="idade" rotulo="Idade" type="number" inputMode="numeric" value={dados.idade} onChange={mudar("idade")} erro={erros.idade} />
        <Campo id="escola" rotulo="Escola" value={dados.escola} onChange={mudar("escola")} erro={erros.escola} />
        <MensagemErro erro={erro} />
        <Botao type="submit" disabled={aEnviar}>{aEnviar ? "A guardar…" : "Continuar"}</Botao>
      </form>
    </EcraProvisorio>
  );
}
