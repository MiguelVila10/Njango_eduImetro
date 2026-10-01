# similaridade/tests.py

from django.test import TestCase

from alunos.models import Aluno, NotaDisciplina
from cursos.models import Curso, VetorIdealCurso
from .services import calcular_similaridade, SIMILARIDADE_NEUTRA


DISCIPLINAS = [
    "Português", "Matemática", "Física", "Química", "Biologia",
    "História", "Geografia", "Língua Estrangeira", "Educação Moral e Cívica",
    "Educação Física", "Educação Visual", "Educação Laboral",
]


def _criar_aluno(nome, notas):
    aluno = Aluno.objects.create(nome=nome, idade=14, escola="Escola Teste")
    for disciplina, nota in zip(DISCIPLINAS, notas):
        NotaDisciplina.objects.create(aluno=aluno, disciplina=disciplina, nota=nota)
    return aluno


def _criar_curso(nome, arquetipo, vetor):
    curso = Curso.objects.create(nome=nome, instituicao="ITEL", arquetipo_dominante=arquetipo)
    for disciplina, peso in zip(DISCIPLINAS, vetor):
        VetorIdealCurso.objects.create(curso=curso, disciplina=disciplina, peso_ideal=peso)
    return curso


class CalcularSimilaridadeTest(TestCase):
    """Testa a Similaridade de Cosseno ajustada (RF08)."""

    def setUp(self):
        self.aluno = Aluno.objects.create(nome="Cientista Teste", idade=14, escola="Escola Teste")
        NotaDisciplina.objects.create(aluno=self.aluno, disciplina="Matemática", nota=16)
        NotaDisciplina.objects.create(aluno=self.aluno, disciplina="Física", nota=15)

        self.curso = Curso.objects.create(nome="Técnico de Informática", instituicao="ITEL", arquetipo_dominante="Analítico")
        VetorIdealCurso.objects.create(curso=self.curso, disciplina="Matemática", peso_ideal=16)
        VetorIdealCurso.objects.create(curso=self.curso, disciplina="Física", peso_ideal=15)

    def test_similaridade_perfeita_retorna_um(self):
        """Happy path: notas do aluno idênticas ao vetor ideal dão similaridade 1.0."""
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


class SimilaridadeAjustadaTest(TestCase):
    """Garante que a versão ajustada distingue cursos (o cosseno simples não distinguia)."""

    def setUp(self):
        # Ordem: Port, Mat, Fís, Quím, Bio, Hist, Geo, LE, EMC, EF, EV, EL
        self.informatica = _criar_curso(
            "Técnico de Informática", "Analítico",
            [14, 19, 17, 14, 13, 12, 12, 15, 14, 14, 13, 17],
        )
        self.comunicacao = _criar_curso(
            "Técnico de Comunicação Social", "Estrategista",
            [19, 14, 12, 12, 12, 16, 15, 16, 16, 14, 14, 13],
        )

    def test_resultado_fica_entre_zero_e_um(self):
        aluno = _criar_aluno("Aluno A", [12, 18, 17, 15, 13, 11, 12, 13, 12, 14, 12, 16])
        for curso in (self.informatica, self.comunicacao):
            score = calcular_similaridade(aluno, curso)
            self.assertGreaterEqual(score, 0.0)
            self.assertLessEqual(score, 1.0)

    def test_aluno_forte_em_ciencias_prefere_informatica(self):
        aluno = _criar_aluno("Aluno Ciências", [12, 18, 17, 15, 13, 11, 12, 13, 12, 14, 12, 16])
        self.assertGreater(
            calcular_similaridade(aluno, self.informatica),
            calcular_similaridade(aluno, self.comunicacao),
        )

    def test_aluno_forte_em_letras_prefere_comunicacao(self):
        aluno = _criar_aluno("Aluno Letras", [18, 12, 11, 11, 12, 17, 15, 16, 16, 13, 13, 12])
        self.assertGreater(
            calcular_similaridade(aluno, self.comunicacao),
            calcular_similaridade(aluno, self.informatica),
        )

    def test_diferenca_entre_cursos_e_significativa(self):
        """O cosseno simples dava diferenças < 0,01; a versão ajustada deve separar bem."""
        aluno = _criar_aluno("Aluno Ciências", [12, 18, 17, 15, 13, 11, 12, 13, 12, 14, 12, 16])
        diferenca = (
            calcular_similaridade(aluno, self.informatica)
            - calcular_similaridade(aluno, self.comunicacao)
        )
        self.assertGreater(diferenca, 0.3)

    def test_aluno_com_notas_todas_iguais_devolve_neutro(self):
        aluno = _criar_aluno("Aluno Plano", [15] * 12)
        self.assertEqual(calcular_similaridade(aluno, self.informatica), SIMILARIDADE_NEUTRA)

    def test_perfil_oposto_fica_abaixo_do_neutro(self):
        aluno = _criar_aluno("Aluno Letras", [18, 12, 11, 11, 12, 17, 15, 16, 16, 13, 13, 12])
        self.assertLess(calcular_similaridade(aluno, self.informatica), SIMILARIDADE_NEUTRA)
