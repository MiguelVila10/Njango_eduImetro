# similaridade/tests.py

from django.test import TestCase

from alunos.models import Aluno, NotaDisciplina
from cursos.models import Curso, VetorIdealCurso
from .services import calcular_similaridade


class CalcularSimilaridadeTest(TestCase):
    """Testa o cálculo da Similaridade de Cosseno (RF08)."""

    def setUp(self):
        self.aluno = Aluno.objects.create(nome="Cientista Teste", idade=14, escola="Escola Teste")
        NotaDisciplina.objects.create(aluno=self.aluno, disciplina="Matemática", nota=16)
        NotaDisciplina.objects.create(aluno=self.aluno, disciplina="Física", nota=15)

        self.curso = Curso.objects.create(nome="Técnico de Informática", instituicao="ITEL", arquetipo_dominante="Analítico")
        VetorIdealCurso.objects.create(curso=self.curso, disciplina="Matemática", peso_ideal=16)
        VetorIdealCurso.objects.create(curso=self.curso, disciplina="Física", peso_ideal=15)

    def test_similaridade_perfeita_retorna_proximo_de_um(self):
        """Happy path: notas do aluno idênticas ao vetor ideal dão similaridade ≈ 1.0."""
        score = calcular_similaridade(self.aluno, self.curso)
        self.assertAlmostEqual(score, 1.0, places=4)

    def test_boletim_incompleto_levanta_erro(self):
        """Caso de erro: falta de nota numa disciplina do vetor ideal levanta ValueError."""
        curso_sem_dados = Curso.objects.create(nome="Curso X", instituicao="ITEL", arquetipo_dominante="Humanista")
        VetorIdealCurso.objects.create(curso=curso_sem_dados, disciplina="Biologia", peso_ideal=14)

        with self.assertRaises(ValueError):
            calcular_similaridade(self.aluno, curso_sem_dados)

    def test_curso_sem_vetor_ideal_levanta_erro(self):
        """Caso de erro: curso sem nenhum VetorIdealCurso levanta ValueError."""
        curso_sem_vetor = Curso.objects.create(nome="Curso Y", instituicao="ITEL", arquetipo_dominante="Criativo")

        with self.assertRaises(ValueError):
            calcular_similaridade(self.aluno, curso_sem_vetor)