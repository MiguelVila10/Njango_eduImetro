# recomendacoes/tests.py

from django.test import TestCase
from django.db import IntegrityError, transaction
from rest_framework.test import APITestCase
from rest_framework import status

from alunos.models import Aluno
from cursos.models import Curso
from .models import Recomendacao


class RecomendacaoModelTest(TestCase):
    """Testa o registo de recomendações (RF10, RF13)."""

    def setUp(self):
        self.aluno = Aluno.objects.create(nome="Cientista Teste", idade=14, escola="Escola Teste")
        self.curso = Curso.objects.create(
            nome="Técnico de Informática", instituicao="ITEL",
            arquetipo_dominante="Analítico"
        )

    def test_criar_recomendacao_com_dados_validos(self):
        """Happy path: uma recomendação válida é criada com sucesso."""
        rec = Recomendacao.objects.create(
            aluno=self.aluno, curso=self.curso,
            score_academico=0.92, score_psicografico=0.85, score_final=0.89, rank=1
        )
        self.assertEqual(Recomendacao.objects.count(), 1)
        self.assertFalse(rec.escolhida_pelo_aluno)

    def test_rank_duplicado_no_mesmo_aluno_e_rejeitado(self):
        """Caso de erro: o mesmo aluno não pode ter duas recomendações com o mesmo rank."""
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
        """Happy path: POST /api/recomendacoes/ cria uma recomendação com sucesso."""
        data = {
            "aluno": self.aluno.id, "curso": self.curso.id,
            "score_academico": 0.92, "score_psicografico": 0.85, "score_final": 0.89, "rank": 1
        }
        response = self.client.post("/api/recomendacoes/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_criar_recomendacao_com_rank_invalido_via_api(self):
        """Caso de erro: rank fora de 1-3 é rejeitado pela API."""
        data = {
            "aluno": self.aluno.id, "curso": self.curso.id,
            "score_academico": 0.92, "score_psicografico": 0.85, "score_final": 0.89, "rank": 5
        }
        response = self.client.post("/api/recomendacoes/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)