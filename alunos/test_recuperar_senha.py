# Recuperar a palavra-passe do orientador por e-mail.

import re

from django.contrib.auth import get_user_model
from django.core import mail
from django.core.cache import cache
from django.test import override_settings
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

User = get_user_model()
NOVA = "Escola2027nova"


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    FRONTEND_URL="http://localhost:5173",
)
class RecuperarSenhaTest(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            username="ana@escola.ao", email="ana@escola.ao", password="Antiga2026",
            first_name="Ana", is_staff=True,
        )

    def pedir(self, email="ana@escola.ao"):
        return self.client.post("/api/auth/recuperar/", {"email": email}, format="json")

    def link(self):
        corpo = mail.outbox[-1].body
        uid, token = re.search(r"nova-senha\?uid=([\w-]+)&token=([\w-]+)", corpo).groups()
        return uid, token

    def definir(self, uid, token, senha=NOVA, confirmar=None):
        return self.client.post(
            "/api/auth/nova-senha/",
            {"uid": uid, "token": token, "password": senha, "confirmar_password": confirmar or senha},
            format="json",
        )

    def test_envia_link_e_permite_definir_palavra_passe_nova(self):
        resposta = self.pedir("Ana@Escola.ao")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["ana@escola.ao"])
        self.assertIn("http://localhost:5173/orientador/nova-senha?uid=", mail.outbox[0].body)

        uid, token = self.link()
        self.assertEqual(self.client.get("/api/auth/nova-senha/", {"uid": uid, "token": token}).status_code, 200)
        Token.objects.create(user=self.user)  # sessão aberta noutro dispositivo

        self.assertEqual(self.definir(uid, token).status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(NOVA))
        self.assertFalse(Token.objects.filter(user=self.user).exists())

        entrar = self.client.post("/api/auth/login/", {"email": "ana@escola.ao", "password": NOVA}, format="json")
        self.assertEqual(entrar.status_code, status.HTTP_200_OK)

    def test_link_so_funciona_uma_vez(self):
        self.pedir()
        uid, token = self.link()
        self.assertEqual(self.definir(uid, token).status_code, status.HTTP_200_OK)
        resposta = self.definir(uid, token, senha="Outra2028senha")
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(resposta.data["codigo"], "link_invalido")

    def test_link_falso_e_recusado(self):
        resposta = self.definir("MQ", "abc-123")
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(resposta.data["codigo"], "link_invalido")
        self.assertEqual(self.client.get("/api/auth/nova-senha/").data["codigo"], "link_invalido")

    def test_nao_revela_se_o_email_existe(self):
        com_conta = self.pedir()
        sem_conta = self.pedir("ninguem@escola.ao")
        self.assertEqual(com_conta.status_code, sem_conta.status_code)
        self.assertEqual(com_conta.data, sem_conta.data)
        self.assertEqual(len(mail.outbox), 1)

    def test_conta_pendente_nao_recebe_link(self):
        User.objects.create_user(username="p@escola.ao", email="p@escola.ao", password="x", is_active=False)
        self.assertEqual(self.pedir("p@escola.ao").status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 0)

    def test_regras_da_palavra_passe_nova(self):
        self.pedir()
        uid, token = self.link()
        self.assertIn("password", self.definir(uid, token, senha="curta1").data)
        self.assertIn("confirmar_password", self.definir(uid, token, confirmar="Diferente2027").data)
        self.assertIn("password", self.definir(uid, token, senha="password123").data)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("Antiga2026"))

    def test_email_invalido(self):
        self.assertEqual(self.pedir("nao-e-email").status_code, status.HTTP_400_BAD_REQUEST)
