# recomendacoes/tests.py

from django.test import TestCase
from django.db import IntegrityError, transaction
from rest_framework.test import APITestCase
from rest_framework import status

from alunos.models import Aluno, NotaDisciplina
from cursos.models import Curso, PreRequisitoCurso, VetorIdealCurso
from cat.models import ItemCAT, RespostaCAT
from .models import Recomendacao
from .services import gerar_recomendacoes


class RecomendacaoModelTest(TestCase):
    """Testa o registo de recomendações (RF10, RF13)."""

    def setUp(self):
        self.aluno = Aluno.objects.create(nome="Cientista Teste", idade=14, escola="Escola Teste")
        self.curso = Curso.objects.create(
            nome="Técnico de Informática", instituicao="ITEL",
            arquetipo_dominante="Analítico"
        )

    def test_criar_recomendacao_com_dados_validos(self):
        rec = Recomendacao.objects.create(
            aluno=self.aluno, curso=self.curso,
            score_academico=0.92, score_psicografico=0.85, score_final=0.89, rank=1
        )
        self.assertEqual(Recomendacao.objects.count(), 1)
        self.assertFalse(rec.escolhida_pelo_aluno)

    def test_rank_duplicado_no_mesmo_aluno_e_rejeitado(self):
        Recomendacao.objects.create(
            aluno=self.aluno, curso=self.curso,
            score_academico=0.92, score_psicografico=0.85, score_final=0.89, rank=1
        )
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Recomendacao.objects.create(
                    aluno=self.aluno, curso=self.curso,
                    score_academico=0.80, score_psicografico=0.70, score_final=0.75, rank=1
                )


class RecomendacaoViewSetTest(APITestCase):
    """Testa o endpoint CRUD de Recomendacao."""

    def setUp(self):
        self.aluno = Aluno.objects.create(nome="Cientista Teste", idade=14, escola="Escola Teste")
        self.curso = Curso.objects.create(
            nome="Técnico de Informática", instituicao="ITEL",
            arquetipo_dominante="Analítico"
        )

    def test_criar_recomendacao_via_api(self):
        data = {
            "aluno": self.aluno.id, "curso": self.curso.id,
            "score_academico": 0.92, "score_psicografico": 0.85, "score_final": 0.89, "rank": 1
        }
        response = self.client.post("/api/recomendacoes/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_criar_recomendacao_com_rank_invalido_via_api(self):
        data = {
            "aluno": self.aluno.id, "curso": self.curso.id,
            "score_academico": 0.92, "score_psicografico": 0.85, "score_final": 0.89, "rank": 5
        }
        response = self.client.post("/api/recomendacoes/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class GerarRecomendacoesTest(TestCase):
    """Testa o orquestrador completo do motor de inferência (RF07, RF08, RF09, RF10)."""

    def setUp(self):
        self.aluno = Aluno.objects.create(nome="Cientista Teste", idade=14, escola="Escola Teste")

        # Boletim completo — as 12 disciplinas, necessárias para deteccao_vieses (VPM)
        notas = {
            "Matemática": 18, "Física": 17, "Química": 16,
            "Biologia": 14, "Português": 13, "Educação Moral e Cívica": 14,
            "Educação Visual": 13, "Educação Laboral": 14, "Língua Estrangeira": 13,
            "História": 13, "Geografia": 14, "Educação Física": 13,
        }
        for disciplina, nota in notas.items():
            NotaDisciplina.objects.create(aluno=self.aluno, disciplina=disciplina, nota=nota)

        self.curso = Curso.objects.create(nome="Técnico de Informática", instituicao="ITEL", arquetipo_dominante="Analítico")
        PreRequisitoCurso.objects.create(curso=self.curso, disciplina="Matemática", nota_min=14)
        VetorIdealCurso.objects.create(curso=self.curso, disciplina="Matemática", peso_ideal=18)
        VetorIdealCurso.objects.create(curso=self.curso, disciplina="Física", peso_ideal=17)

        item = ItemCAT.objects.create(texto="Pergunta", tipo="nucleo", opcoes=[
            {"texto": "a", "arquetipo": "Analítico"}, {"texto": "b", "arquetipo": "Humanista"},
            {"texto": "c", "arquetipo": "Criativo"}, {"texto": "d", "arquetipo": "Estrategista"},
        ])
        RespostaCAT.objects.create(aluno=self.aluno, item=item, arquetipo_escolhido="Analítico")

    def test_gera_recomendacao_com_scores_calculados(self):
        recomendacoes = gerar_recomendacoes(self.aluno)

        self.assertEqual(len(recomendacoes), 1)
        rec = recomendacoes[0]
        self.assertEqual(rec.rank, 1)
        self.assertAlmostEqual(rec.score_academico, 1.0, places=2)
        self.assertEqual(rec.score_psicografico, 1.0)
        self.assertAlmostEqual(rec.score_final, 0.6 * 1.0 + 0.4 * 1.0, places=2)
        self.assertIn("sobrestimacao", rec.alertas_vieses)

    def test_sem_respostas_cat_levanta_erro(self):
        aluno_sem_cat = Aluno.objects.create(nome="Aluno Sem CAT", idade=14, escola="Escola Teste")
        NotaDisciplina.objects.create(aluno=aluno_sem_cat, disciplina="Matemática", nota=18)

        with self.assertRaises(ValueError):
            gerar_recomendacoes(aluno_sem_cat)
class GerarRecomendacoesViewTest(APITestCase):
    """Testa o endpoint POST /api/recomendacoes/gerar/{aluno_id}/."""

    def setUp(self):
        self.aluno = Aluno.objects.create(nome="Cientista Teste", idade=14, escola="Escola Teste")
        notas = {
            "Matemática": 18, "Física": 17, "Química": 16,
            "Biologia": 14, "Português": 13, "Educação Moral e Cívica": 14,
            "Educação Visual": 13, "Educação Laboral": 14, "Língua Estrangeira": 13,
            "História": 13, "Geografia": 14, "Educação Física": 13,
        }
        for disciplina, nota in notas.items():
            NotaDisciplina.objects.create(aluno=self.aluno, disciplina=disciplina, nota=nota)

        self.curso = Curso.objects.create(nome="Técnico de Informática", instituicao="ITEL", arquetipo_dominante="Analítico")
        PreRequisitoCurso.objects.create(curso=self.curso, disciplina="Matemática", nota_min=14)
        VetorIdealCurso.objects.create(curso=self.curso, disciplina="Matemática", peso_ideal=18)
        VetorIdealCurso.objects.create(curso=self.curso, disciplina="Física", peso_ideal=17)

        item = ItemCAT.objects.create(texto="Pergunta", tipo="nucleo", opcoes=[
            {"texto": "a", "arquetipo": "Analítico"}, {"texto": "b", "arquetipo": "Humanista"},
            {"texto": "c", "arquetipo": "Criativo"}, {"texto": "d", "arquetipo": "Estrategista"},
        ])
        RespostaCAT.objects.create(aluno=self.aluno, item=item, arquetipo_escolhido="Analítico")

    def test_gerar_via_api_retorna_recomendacoes(self):
        """Happy path: POST gera e devolve as recomendações via HTTP."""
        response = self.client.post(f"/api/recomendacoes/gerar/{self.aluno.id}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["rank"], 1)
        self.assertIn("alertas_vieses", response.data[0])

    def test_gerar_com_aluno_inexistente_retorna_404(self):
        """Caso de erro: aluno_id inexistente devolve 404."""
        response = self.client.post("/api/recomendacoes/gerar/9999/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_gerar_sem_respostas_cat_retorna_400(self):
        """Caso de erro: aluno sem respostas ao CAT devolve 400 com mensagem clara."""
        aluno_sem_cat = Aluno.objects.create(nome="Aluno Sem CAT", idade=14, escola="Escola Teste")

        response = self.client.post(f"/api/recomendacoes/gerar/{aluno_sem_cat.id}/")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("erro", response.data)