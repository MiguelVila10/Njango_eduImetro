from alunos.apoio_testes import autenticar_orientador
from django.test import TestCase

# Create your tests here.
# cat/tests.py

from django.test import TestCase
from django.core.exceptions import ValidationError
from rest_framework.test import APITestCase
from rest_framework import status
from .models import ItemCAT
from .serializers import ItemCATSerializer


OPCOES_VALIDAS = [
    {"texto": "Gosto de resolver problemas de lógica.", "arquetipo": "Analítico"},
    {"texto": "Gosto de ajudar e cuidar de pessoas.", "arquetipo": "Humanista"},
    {"texto": "Gosto de desenhar e criar coisas novas.", "arquetipo": "Criativo"},
    {"texto": "Gosto de planear e organizar equipas.", "arquetipo": "Estrategista"},
]


class ItemCATModelTest(TestCase):
    """Testa o registo de itens do banco CAT (RF04, RF05)."""

    def test_criar_item_com_dados_validos(self):
        """Happy path: um item com 4 opções válidas é criado com sucesso."""
        item = ItemCAT.objects.create(
            texto="O que preferes fazer nos tempos livres?",
            tipo="nucleo",
            opcoes=OPCOES_VALIDAS
        )
        self.assertEqual(ItemCAT.objects.count(), 1)
        item.full_clean()  # não deve levantar erro

    def test_item_com_numero_errado_de_opcoes_e_rejeitado(self):
        """Caso de erro: menos de 4 opções não deve ser aceite pelo clean()."""
        item = ItemCAT(
            texto="Pergunta inválida",
            tipo="nucleo",
            opcoes=OPCOES_VALIDAS[:2]
        )
        with self.assertRaises(ValidationError):
            item.full_clean()


class ItemCATSerializerTest(TestCase):
    """Testa a validação do serializer de ItemCAT."""

    def test_serializer_aceita_opcoes_validas(self):
        """Happy path: payload com 4 opções cobrindo os 4 arquétipos é aceite."""
        data = {"texto": "Pergunta teste", "tipo": "nucleo", "opcoes": OPCOES_VALIDAS}
        serializer = ItemCATSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_serializer_rejeita_arquetipo_repetido(self):
        """Caso de erro: opções com arquétipo repetido (faltando um dos 4) é rejeitado."""
        opcoes_invalidas = OPCOES_VALIDAS[:3] + [{"texto": "Repetida", "arquetipo": "Analítico"}]
        data = {"texto": "Pergunta teste", "tipo": "nucleo", "opcoes": opcoes_invalidas}
        serializer = ItemCATSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("opcoes", serializer.errors)


class ItemCATViewSetTest(APITestCase):
    """Testa o endpoint CRUD de ItemCAT."""

    def setUp(self):
        autenticar_orientador(self.client)

    def test_criar_item_via_api(self):
        """Happy path: POST /api/itens-cat/ cria um item com sucesso."""
        data = {"texto": "Pergunta via API", "tipo": "nucleo", "opcoes": OPCOES_VALIDAS}
        response = self.client.post("/api/itens-cat/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_criar_item_com_opcoes_invalidas_via_api(self):
        """Caso de erro: opções malformadas são rejeitadas pela API."""
        data = {"texto": "Pergunta inválida", "tipo": "nucleo", "opcoes": [{"texto": "só uma"}]}
        response = self.client.post("/api/itens-cat/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
from django.db import IntegrityError, transaction
from alunos.models import Aluno
from .models import RespostaCAT


class RespostaCATModelTest(TestCase):
    """Testa o registo de respostas ao CAT (RF04, RF06)."""

    def setUp(self):
        self.aluno = Aluno.objects.create(nome="Cientista Teste", idade=14, escola="Escola Teste")
        self.item = ItemCAT.objects.create(texto="Pergunta teste", tipo="nucleo", opcoes=OPCOES_VALIDAS)

    def test_criar_resposta_com_dados_validos(self):
        """Happy path: uma resposta válida a um item é criada com sucesso."""
        resposta = RespostaCAT.objects.create(aluno=self.aluno, item=self.item, arquetipo_escolhido="Analítico")
        self.assertEqual(RespostaCAT.objects.count(), 1)

    def test_resposta_duplicada_ao_mesmo_item_e_rejeitada(self):
        """Caso de erro: o aluno não pode responder duas vezes ao mesmo item."""
        RespostaCAT.objects.create(aluno=self.aluno, item=self.item, arquetipo_escolhido="Analítico")
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                RespostaCAT.objects.create(aluno=self.aluno, item=self.item, arquetipo_escolhido="Humanista")


class RespostaCATViewSetTest(APITestCase):
    """Testa o endpoint CRUD de RespostaCAT."""

    def setUp(self):
        autenticar_orientador(self.client)
        self.aluno = Aluno.objects.create(nome="Cientista Teste", idade=14, escola="Escola Teste")
        self.item = ItemCAT.objects.create(texto="Pergunta teste", tipo="nucleo", opcoes=OPCOES_VALIDAS)

    def test_criar_resposta_via_api(self):
        """Happy path: POST /api/respostas-cat/ cria uma resposta com sucesso."""
        data = {"aluno": self.aluno.id, "item": self.item.id, "arquetipo_escolhido": "Analítico"}
        response = self.client.post("/api/respostas-cat/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_criar_resposta_duplicada_via_api(self):
        """Caso de erro: resposta duplicada ao mesmo item é rejeitada pela API."""
        RespostaCAT.objects.create(aluno=self.aluno, item=self.item, arquetipo_escolhido="Analítico")
        data = {"aluno": self.aluno.id, "item": self.item.id, "arquetipo_escolhido": "Humanista"}
        response = self.client.post("/api/respostas-cat/", data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)