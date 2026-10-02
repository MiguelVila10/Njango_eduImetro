from alunos.apoio_testes import autenticar_orientador
from django.db import IntegrityError, transaction
from django.test import TestCase
from django.core.exceptions import ValidationError
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Aluno
from .serializers import AlunoSerializer


class AlunoModelTest(TestCase):
    def test_criar_aluno_com_dados_validos(self):
        aluno = Aluno.objects.create(nome="Cientista Teste", idade=14, escola="Escola Secundária de Luanda")
        self.assertEqual(Aluno.objects.count(), 1)
        self.assertEqual(aluno.nome, "Cientista Teste")
        self.assertEqual(str(aluno), "Cientista Teste (Escola Secundária de Luanda)")

    def test_idade_negativa_e_rejeitada(self):
        aluno = Aluno(nome="Aluno Inválido", idade=-1, escola="Escola Teste")
        with self.assertRaises(ValidationError):
            aluno.full_clean()


class AlunoSerializerTest(TestCase):
    def test_serializer_aceita_dados_validos(self):
        data = {"nome": "Cientista Teste", "idade": 14, "escola": "Escola Secundária de Luanda"}
        serializer = AlunoSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        aluno = serializer.save()
        self.assertEqual(aluno.nome, "Cientista Teste")

    def test_serializer_rejeita_idade_invalida(self):
        data = {"nome": "Aluno Inválido", "idade": 0, "escola": "Escola Teste"}
        serializer = AlunoSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("idade", serializer.errors)


class AlunoViewSetTest(APITestCase):
    def test_criar_aluno_via_api(self):
        data = {"nome": "Ana Paula", "idade": 12, "escola": "Nossa Senhora da Anunciação"}
        response = self.client.post("/api/alunos/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["nome"], "Ana Paula")

    def test_criar_aluno_com_idade_invalida_via_api(self):
        data = {"nome": "Aluno Inválido", "idade": 0, "escola": "Escola Teste"}
        response = self.client.post("/api/alunos/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class NotaDisciplinaViewSetTest(APITestCase):
    """Testa o endpoint CRUD de NotaDisciplina (RF02, RF03)."""

    def setUp(self):
        autenticar_orientador(self.client)
        self.aluno = Aluno.objects.create(nome="Cientista Teste", idade=14, escola="Escola Teste")

    def test_criar_nota_via_api(self):
        """Happy path: POST /api/notas-disciplina/ cria uma nota com sucesso."""
        data = {"aluno": self.aluno.id, "disciplina": "Matemática", "nota": 15}
        response = self.client.post("/api/notas-disciplina/", data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["nota"], 15)

    def test_criar_nota_duplicada_via_api(self):
        """Caso de erro: nota duplicada na mesma disciplina é rejeitada pela API."""
        NotaDisciplina.objects.create(aluno=self.aluno, disciplina="Matemática", nota=15)
        data = {"aluno": self.aluno.id, "disciplina": "Matemática", "nota": 18}
        response = self.client.post("/api/notas-disciplina/", data, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


from django.db import IntegrityError, transaction
from .models import NotaDisciplina


class NotaDisciplinaModelTest(TestCase):
    """Testa o registo de notas por disciplina (RF02, RF03)."""

    def setUp(self):
        autenticar_orientador(self.client)
        self.aluno = Aluno.objects.create(nome="Cientista Teste", idade=14, escola="Escola Teste")

    def test_criar_nota_com_dados_validos(self):
        """Happy path: uma nota válida numa disciplina é criada com sucesso."""
        nota = NotaDisciplina.objects.create(aluno=self.aluno, disciplina="Matemática", nota=15)

        self.assertEqual(NotaDisciplina.objects.count(), 1)
        self.assertEqual(nota.nota, 15)

    def test_nota_duplicada_na_mesma_disciplina_e_rejeitada(self):
        """Caso de erro: o aluno não pode ter duas notas na mesma disciplina."""
        NotaDisciplina.objects.create(aluno=self.aluno, disciplina="Matemática", nota=15)

        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                NotaDisciplina.objects.create(aluno=self.aluno, disciplina="Matemática", nota=18)

    def test_boletim_completo_indica_disciplinas_em_falta(self):
        """GET /api/alunos/{id}/boletim-completo/ lista as disciplinas que faltam."""
        aluno = Aluno.objects.create(nome="Aluno Incompleto", idade=14, escola="Escola Teste")
        NotaDisciplina.objects.create(aluno=aluno, disciplina="Matemática", nota=15)

        response = self.client.get(f"/api/alunos/{aluno.id}/boletim-completo/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["completo"])
        self.assertIn("Física", response.data["faltam"])
        self.assertNotIn("Matemática", response.data["faltam"])

    def test_boletim_completo_confirma_quando_todas_as_notas_existem(self):
        """GET /api/alunos/{id}/boletim-completo/ confirma boletim completo."""
        aluno = Aluno.objects.create(nome="Aluno Completo", idade=14, escola="Escola Teste")
        disciplinas = [
            "Português", "Matemática", "Física", "Química", "Biologia",
            "História", "Geografia", "Língua Estrangeira", "Educação Moral e Cívica",
            "Educação Física", "Educação Visual", "Educação Laboral",
        ]
        for disciplina in disciplinas:
            NotaDisciplina.objects.create(aluno=aluno, disciplina=disciplina, nota=14)

        response = self.client.get(f"/api/alunos/{aluno.id}/boletim-completo/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["completo"])
        self.assertEqual(response.data["faltam"], [])