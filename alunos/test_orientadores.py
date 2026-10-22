# Acesso do orientador: entrar por e-mail e pedido de conta com aprovação.

from io import StringIO

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.management import call_command
from rest_framework import status
from rest_framework.test import APITestCase

from .models import PerfilOrientador

User = get_user_model()
SENHA = "Orientar2026"


class AcessoOrientadorTest(APITestCase):
    def setUp(self):
        cache.clear()  # o limite de tentativas usa a cache

    def pedir_conta(self, **dados):
        base = {
            "nome": "Ana Kiluange", "email": "Ana@Escola.ao", "escola": "Escola do I Ciclo n.º 1234",
            "password": SENHA, "confirmar_password": SENHA, "aceita_termos": True,
        }
        base.update(dados)
        return self.client.post("/api/orientadores/registo/", base, format="json")

    def entrar(self, identificador, senha=SENHA, chave="email"):
        return self.client.post("/api/auth/login/", {chave: identificador, "password": senha}, format="json")

    def test_pedido_de_conta_fica_pendente_e_nao_entra(self):
        self.assertEqual(self.pedir_conta().status_code, status.HTTP_201_CREATED)
        user = User.objects.get(email="ana@escola.ao")
        self.assertFalse(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertTrue(PerfilOrientador.objects.get(user=user).pendente)

        resposta = self.entrar("ana@escola.ao")
        self.assertEqual(resposta.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(resposta.data["codigo"], "conta_pendente")

    def test_depois_de_aprovada_entra_e_ve_alunos(self):
        self.pedir_conta()
        call_command("aprovar_orientador", email="ana@escola.ao", stdout=StringIO())
        resposta = self.entrar("ANA@escola.ao")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(resposta.data["nome"], "Ana Kiluange")

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {resposta.data['token']}")
        self.assertEqual(self.client.get("/api/alunos/").status_code, status.HTTP_200_OK)

    def test_palavra_passe_errada_nao_diz_qual_campo_falhou(self):
        self.pedir_conta()
        call_command("aprovar_orientador", email="ana@escola.ao", stdout=StringIO())
        errada = self.entrar("ana@escola.ao", senha="outra12345")
        inexistente = self.entrar("ninguem@escola.ao")
        self.assertEqual(errada.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(errada.data, inexistente.data)

    def test_conta_antiga_entra_com_nome_de_utilizador(self):
        User.objects.create_user(username="prof.ana", password=SENHA, is_staff=True)
        self.assertEqual(self.entrar("prof.ana", chave="username").status_code, status.HTTP_200_OK)

    def test_utilizador_sem_acesso_de_orientador_e_recusado(self):
        User.objects.create_user(username="x", email="x@escola.ao", password=SENHA, is_staff=False)
        self.assertEqual(self.entrar("x@escola.ao").status_code, status.HTTP_403_FORBIDDEN)

    def test_validacoes_do_pedido_de_conta(self):
        casos = {
            "aceita_termos": {"aceita_termos": False},
            "password": {"password": "abcdefgh", "confirmar_password": "abcdefgh"},
            "confirmar_password": {"confirmar_password": "Outra2026x"},
            "nome": {"nome": "Ana"},
            "escola": {"escola": "***"},
        }
        for campo, dados in casos.items():
            with self.subTest(campo=campo):
                resposta = self.pedir_conta(**dados)
                self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn(campo, resposta.data)

    def test_email_repetido_e_recusado(self):
        self.pedir_conta()
        resposta = self.pedir_conta(email="ana@escola.ao")
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", resposta.data)
