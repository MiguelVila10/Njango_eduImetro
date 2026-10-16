import { Navigate, Route, Routes } from "react-router-dom";

import { OuvirSessaoExpirada, RotaAluno, RotaOrientador } from "./rotas/Protecoes";

import CursoEscolhido from "./paginas/aluno/CursoEscolhido";
import Inicio from "./paginas/aluno/Inicio";
import Notas from "./paginas/aluno/Notas";
import Registo from "./paginas/aluno/Registo";
import Resultado from "./paginas/aluno/Resultado";
import SessaoExpirada from "./paginas/aluno/SessaoExpirada";
import Teste from "./paginas/aluno/Teste";

import Alunos from "./paginas/orientador/Alunos";
import Cursos from "./paginas/orientador/Cursos";
import Entrar from "./paginas/orientador/Entrar";
import FichaAluno from "./paginas/orientador/FichaAluno";
import LayoutOrientador from "./paginas/orientador/Layout";
import Painel from "./paginas/orientador/Painel";
import Perguntas from "./paginas/orientador/Perguntas";

export default function App() {
  return (
    <>
      <OuvirSessaoExpirada />
      <Routes>
        {/* Aluno */}
        <Route path="/" element={<Inicio />} />
        <Route path="/registo" element={<Registo />} />
        <Route path="/sessao-expirada" element={<SessaoExpirada />} />
        <Route path="/aluno" element={<RotaAluno />}>
          <Route path="notas" element={<Notas />} />
          <Route path="teste" element={<Teste />} />
          <Route path="resultado" element={<Resultado />} />
          <Route path="curso-escolhido" element={<CursoEscolhido />} />
        </Route>

        {/* Orientador */}
        <Route path="/orientador/entrar" element={<Entrar />} />
        <Route path="/orientador" element={<RotaOrientador />}>
          <Route element={<LayoutOrientador />}>
            <Route index element={<Painel />} />
            <Route path="alunos" element={<Alunos />} />
            <Route path="alunos/:id" element={<FichaAluno />} />
            <Route path="cursos" element={<Cursos />} />
            <Route path="perguntas" element={<Perguntas />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
