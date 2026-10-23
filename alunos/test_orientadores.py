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


class PedidosContaTest(APITestCase):
    def setUp(self):
        cache.clear()
        for email, nome in [("a@escola.ao", "Ana Kiluange"), ("b@escola.ao", "Bento Lunda")]:
            self.client.post("/api/orientadores/registo/", {
                "nome": nome, "email": email, "escola": "Escola n.º 1",
                "password": SENHA, "confirmar_password": SENHA, "aceita_termos": True,
            }, format="json")
        self.admin = User.objects.create_user(username="admin.escola", password=SENHA, is_staff=True)
        call_command("configurar_orientador", username="admin.escola", administrador=True, stdout=StringIO())

    def entrar(self, identificador):
        r = self.client.post("/api/auth/login/", {"email": identificador, "password": SENHA}, format="json")
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {r.data['token']}")
        return r

    def test_administrador_lista_aprova_e_recusa(self):
        self.assertTrue(self.entrar("admin.escola").data["administrador"])
        pendentes = self.client.get("/api/orientadores/pedidos/").data["pendentes"]
        self.assertEqual([p["email"] for p in pendentes], ["a@escola.ao", "b@escola.ao"])

        aprovar = self.client.post(f"/api/orientadores/pedidos/{pendentes[0]['id']}/aprovar/")
        self.assertEqual(aprovar.status_code, status.HTTP_200_OK)
        self.assertTrue(User.objects.get(email="a@escola.ao").is_active)

        recusar = self.client.post(f"/api/orientadores/pedidos/{pendentes[1]['id']}/recusar/")
        self.assertEqual(recusar.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(email="b@escola.ao").exists())

        dados = self.client.get("/api/orientadores/pedidos/").data
        self.assertEqual(dados["pendentes"], [])
        self.assertEqual(dados["aprovados"][0]["email"], "a@escola.ao")

    def test_orientador_normal_nao_ve_pedidos(self):
        call_command("aprovar_orientador", email="a@escola.ao", stdout=StringIO())
        r = self.entrar("a@escola.ao")
        self.assertFalse(r.data["administrador"])
        self.assertEqual(self.client.get("/api/orientadores/pedidos/").status_code, status.HTTP_403_FORBIDDEN)
        pid = PerfilOrientador.objects.get(user__email="b@escola.ao").pk
        self.assertEqual(self.client.post(f"/api/orientadores/pedidos/{pid}/aprovar/").status_code, status.HTTP_403_FORBIDDEN)

    def test_sem_sessao_nao_ve_pedidos(self):
        self.assertIn(self.client.get("/api/orientadores/pedidos/").status_code, (401, 403))


class PapelAdministradorTest(APITestCase):
    """Só quem recebeu --administrador vê os pedidos de conta; aprovar uma conta não a torna administradora."""

    def setUp(self):
        cache.clear()
        call_command("configurar_orientador", username="admin.escola", password="Senha2026forte",
                     administrador=True, stdout=StringIO())
        self.client.post("/api/orientadores/registo/", {
            "nome": "Bento Teste", "email": "bento@escola.ao", "escola": "Escola n.º 2",
            "password": SENHA, "confirmar_password": SENHA, "aceita_termos": True,
        }, format="json")
        from .orientadores import aprovar_conta_orientador
        aprovar_conta_orientador(User.objects.get(email="bento@escola.ao"))

    def entrar(self, ident, senha):
        return self.client.post("/api/auth/login/", {"email": ident, "password": senha}, format="json").data

    def test_conta_aprovada_nao_e_administradora(self):
        self.assertFalse(self.entrar("bento@escola.ao", SENHA)["administrador"])
        self.assertTrue(self.entrar("admin.escola", "Senha2026forte")["administrador"])

    def test_remover_administrador_e_listar(self):
        call_command("configurar_orientador", username="admin.escola", remover_administrador=True, stdout=StringIO())
        self.assertFalse(self.entrar("admin.escola", "Senha2026forte")["administrador"])
        saida = StringIO()
        call_command("configurar_orientador", listar=True, stdout=saida)
        self.assertIn("bento@escola.ao", saida.getvalue())


class JuntarAlunosTest(APITestCase):
    """juntar_alunos junta os alunos de uma cópia sem apagar nem repetir."""

    def test_junta_sem_apagar_e_sem_repetir(self):
        import json
        import tempfile
        from django.core import serializers as ser
        from alunos.models import Aluno, NotaDisciplina
        from cat.models import ItemCAT, RespostaCAT
        from cursos.models import Curso
        from recomendacoes.models import Recomendacao

        curso = Curso.objects.create(nome="Técnico de Informática", instituicao="ITEL", arquetipo_dominante="Analítico")
        item = ItemCAT.objects.create(codigo="AN-99", texto="Pergunta", tipo="nucleo", tendencia="Analítico",
                                      opcoes=[{"texto": t, "arquetipo": a} for t, a in
                                              [("a", "Analítico"), ("b", "Humanista"), ("c", "Criativo"), ("d", "Estrategista")]])
        de_fora = Aluno.objects.create(nome="Rosa Ndala", idade=15, escola="Escola n.º 7")
        NotaDisciplina.objects.create(aluno=de_fora, disciplina="Matemática", nota=16)
        RespostaCAT.objects.create(aluno=de_fora, item=item, arquetipo_escolhido="Analítico")
        Recomendacao.objects.create(aluno=de_fora, curso=curso, score_academico=0.8, score_psicografico=0.5,
                                    score_final=0.68, rank=1, escolhida_pelo_aluno=True)
        copia = ser.serialize("json", [curso, item, de_fora, *de_fora.notas.all(), *de_fora.respostas_cat.all(),
                                       *de_fora.recomendacoes.all()], use_natural_foreign_keys=True)
        ficheiro = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8")
        ficheiro.write(copia); ficheiro.close()

        # "Outro computador": o aluno da cópia não existe, mas há um aluno próprio.
        de_fora.delete()
        proprio = Aluno.objects.create(nome="Kiala Tomás", idade=14, escola="Escola n.º 3")

        call_command("juntar_alunos", ficheiro.name, simular=True, stdout=StringIO())
        self.assertEqual(Aluno.objects.count(), 1)  # simular não grava

        call_command("juntar_alunos", ficheiro.name, stdout=StringIO())
        call_command("juntar_alunos", ficheiro.name, stdout=StringIO())  # 2.ª vez: não repete
        self.assertTrue(Aluno.objects.filter(pk=proprio.pk).exists())
        rosa = Aluno.objects.get(nome="Rosa Ndala")
        self.assertEqual(Aluno.objects.count(), 2)
        self.assertEqual(rosa.notas.get().nota, 16)
        self.assertEqual(rosa.respostas_cat.get().item, item)
        self.assertTrue(rosa.recomendacoes.get().escolhida_pelo_aluno)
