from django.test import TestCase

from alunos.models import Aluno, NotaDisciplina
from cursos.models import Curso, PreRequisitoCurso
from .services import filtrar_cursos


class FiltrarCursosTest(TestCase):
    def setUp(self):
        self.aluno = Aluno.objects.create(nome="Cientista Teste", idade=14, escola="Escola Teste")
        NotaDisciplina.objects.create(aluno=self.aluno, disciplina="Matemática", nota=16)
        NotaDisciplina.objects.create(aluno=self.aluno, disciplina="Física", nota=12)

        self.curso_aprovado = Curso.objects.create(nome="Técnico de Informática", instituicao="ITEL", arquetipo_dominante="Analítico")
        PreRequisitoCurso.objects.create(curso=self.curso_aprovado, disciplina="Matemática", nota_min=14)

        self.curso_eliminado = Curso.objects.create(nome="Técnico de Electrónica", instituicao="ITEL", arquetipo_dominante="Analítico")
        PreRequisitoCurso.objects.create(curso=self.curso_eliminado, disciplina="Matemática", nota_min=14)
        PreRequisitoCurso.objects.create(curso=self.curso_eliminado, disciplina="Física", nota_min=14)

    def test_curso_eliminado_por_falhar_um_de_varios_prerequisitos(self):
        """O curso é eliminado se falhar qualquer um dos seus pré-requisitos (Física=12 < 14)."""
        aprovados, eliminacoes = filtrar_cursos(self.aluno)

        self.assertIn(self.curso_aprovado, aprovados)
        self.assertEqual(len(eliminacoes), 1)
        self.assertEqual(eliminacoes[0]["curso"], self.curso_eliminado)
        self.assertIn("Física", eliminacoes[0]["motivo"])

    def test_boletim_incompleto_levanta_erro(self):
        Curso.objects.create(nome="Curso X", instituicao="ITEL", arquetipo_dominante="Humanista").prerequisitos.create(disciplina="Biologia", nota_min=12)
        with self.assertRaises(ValueError):
            filtrar_cursos(self.aluno)