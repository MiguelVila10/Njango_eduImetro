# alunos/test_permissoes.py
"""
Testes do controlo de acesso (RNF de privacidade) e dos fluxos do aluno e do
orientador: sessão do aluno, catálogo público, CAT, gerar e escolher.
"""

from datetime import timedelta
from io import StringIO

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from cat.models import ItemCAT, RespostaCAT
from cursos.models import Curso, PreRequisitoCurso, VetorIdealCurso
from recomendacoes.models import Recomendacao
from .apoio_testes import autenticar_orientador
from .models import Aluno, NotaDisciplina

OPCOES = [
    {"texto": "a", "arquetipo": "Analítico"}, {"texto": "b", "arquetipo": "Humanista"},
    {"texto": "c", "arquetipo": "Criativo"}, {"texto": "d", "arquetipo": "Estrategista"},
]

NOTAS = {
    "Matemática": 18, "Física": 17, "Química": 16,
    "Biologia": 14, "Português": 13, "Educação Moral e Cívica": 14,
    "Educação Visual": 13, "Educação Laboral": 14, "Língua Estrangeira": 13,
    "História": 13, "Geografia": 14, "Educação Física": 13,
}


# Sem login de orientador, a API responde 401 (não autenticado) ou 403
# (autenticado mas sem permissão). Ambos significam "acesso negado".
NEGADO = (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


def iniciar_sessao(client, nome="Aluno"):
    """Simula o aluno a iniciar o teste: cria o registo e guarda o token."""
    resposta = client.post("/api/alunos/", {"nome": nome, "idade": 15, "escola": "Escola"}, format="json")
    assert resposta.status_code == status.HTTP_201_CREATED, resposta.data
    client.credentials(HTTP_X_SESSAO_ALUNO=resposta.data["token_sessao"])
    return resposta.data["id"]


class SessaoDoAlunoTest(APITestCase):

    def setUp(self):
        self.outro = Aluno.objects.create(nome="Outro", idade=15, escola="X")

    def test_qualquer_um_pode_iniciar_o_teste_e_recebe_token(self):
        resposta = self.client.post("/api/alunos/", {"nome": "Ana", "idade": 15, "escola": "E"}, format="json")
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertIn("token_sessao", resposta.data)

    def test_sem_sessao_nao_lista_alunos(self):
        self.assertIn(self.client.get("/api/alunos/").status_code, NEGADO)

    def test_aluno_nao_lista_todos_os_alunos(self):
        iniciar_sessao(self.client)
        self.assertIn(self.client.get("/api/alunos/").status_code, NEGADO)

    def test_aluno_ve_o_seu_registo(self):
        aluno_id = iniciar_sessao(self.client)
        self.assertEqual(self.client.get(f"/api/alunos/{aluno_id}/").status_code, status.HTTP_200_OK)

    def test_aluno_nao_ve_registo_de_outro_aluno(self):
        iniciar_sessao(self.client)
        resposta = self.client.get(f"/api/alunos/{self.outro.id}/")
        self.assertEqual(resposta.status_code, status.HTTP_404_NOT_FOUND)

    def test_token_invalido_e_rejeitado(self):
        self.client.credentials(HTTP_X_SESSAO_ALUNO="token-falso")
        resposta = self.client.get(f"/api/alunos/{self.outro.id}/")
        self.assertIn(resposta.status_code, NEGADO)

    def test_token_expirado_e_rejeitado(self):
        aluno_id = iniciar_sessao(self.client)
        with override_settings(SESSAO_ALUNO_DURACAO=timedelta(seconds=-1)):
            resposta = self.client.get(f"/api/alunos/{aluno_id}/")
        self.assertIn(resposta.status_code, NEGADO)


class NotasDoAlunoTest(APITestCase):

    def setUp(self):
        self.outro = Aluno.objects.create(nome="Outro", idade=15, escola="X")
        NotaDisciplina.objects.create(aluno=self.outro, disciplina="Matemática", nota=12)
        self.aluno_id = iniciar_sessao(self.client)

    def test_aluno_regista_nota_no_seu_perfil(self):
        resposta = self.client.post("/api/notas-disciplina/",
                                    {"aluno": self.aluno_id, "disciplina": "Matemática", "nota": 16}, format="json")
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)

    def test_aluno_nao_regista_nota_no_perfil_de_outro(self):
        resposta = self.client.post("/api/notas-disciplina/",
                                    {"aluno": self.outro.id, "disciplina": "Física", "nota": 16}, format="json")
        self.assertEqual(resposta.status_code, status.HTTP_403_FORBIDDEN)

    def test_aluno_so_ve_as_suas_notas(self):
        self.client.post("/api/notas-disciplina/",
                         {"aluno": self.aluno_id, "disciplina": "Matemática", "nota": 16}, format="json")
        resposta = self.client.get("/api/notas-disciplina/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual({n["aluno"] for n in resposta.data}, {self.aluno_id})


class CatalogoPublicoTest(APITestCase):

    def setUp(self):
        Curso.objects.create(nome="Informática", instituicao="ITEL", arquetipo_dominante="Analítico")
        ItemCAT.objects.create(texto="P", tipo="nucleo", opcoes=OPCOES)

    def test_qualquer_um_le_cursos_e_perguntas(self):
        self.assertEqual(self.client.get("/api/cursos/").status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get("/api/itens-cat/").status_code, status.HTTP_200_OK)

    def test_aluno_nao_altera_o_catalogo(self):
        iniciar_sessao(self.client)
        resposta = self.client.post("/api/cursos/", {"nome": "X", "instituicao": "ITEL",
                                                     "arquetipo_dominante": "Analítico"}, format="json")
        self.assertIn(resposta.status_code, NEGADO)
        resposta = self.client.post("/api/itens-cat/", {"texto": "Y", "tipo": "nucleo",
                                                        "opcoes": OPCOES}, format="json")
        self.assertIn(resposta.status_code, NEGADO)


class FluxoDoAlunoTest(APITestCase):
    """Do início do teste até à escolha do curso, só com o token de sessão."""

    def setUp(self):
        self.curso = Curso.objects.create(nome="Informática", instituicao="ITEL", arquetipo_dominante="Analítico")
        PreRequisitoCurso.objects.create(curso=self.curso, disciplina="Matemática", nota_min=14)
        for disciplina, peso in [("Matemática", 18), ("Física", 17), ("Português", 13)]:
            VetorIdealCurso.objects.create(curso=self.curso, disciplina=disciplina, peso_ideal=peso)
        self.itens = [ItemCAT.objects.create(texto=f"P{i}", tipo="nucleo", opcoes=OPCOES) for i in range(3)]
        self.outro = Aluno.objects.create(nome="Outro", idade=15, escola="X")
        self.aluno_id = iniciar_sessao(self.client)
        for disciplina, nota in NOTAS.items():
            self.client.post("/api/notas-disciplina/",
                             {"aluno": self.aluno_id, "disciplina": disciplina, "nota": nota}, format="json")

    def _responder_todas(self):
        for item in self.itens:
            self.client.post("/api/respostas-cat/", {"aluno": self.aluno_id, "item": item.id,
                                                      "arquetipo_escolhido": "Analítico"}, format="json")

    def test_aluno_pede_a_proxima_pergunta(self):
        resposta = self.client.get(f"/api/cat/proxima/{self.aluno_id}/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertFalse(resposta.data["terminado"])

    def test_aluno_nao_ve_o_cat_de_outro(self):
        resposta = self.client.get(f"/api/cat/proxima/{self.outro.id}/")
        self.assertEqual(resposta.status_code, status.HTTP_403_FORBIDDEN)

    def test_aluno_nao_responde_pelo_outro(self):
        resposta = self.client.post("/api/respostas-cat/", {"aluno": self.outro.id, "item": self.itens[0].id,
                                                            "arquetipo_escolhido": "Analítico"}, format="json")
        self.assertEqual(resposta.status_code, status.HTTP_403_FORBIDDEN)

    def test_gerar_antes_de_o_cat_terminar_devolve_400(self):
        self.client.post("/api/respostas-cat/", {"aluno": self.aluno_id, "item": self.itens[0].id,
                                                  "arquetipo_escolhido": "Analítico"}, format="json")
        resposta = self.client.post(f"/api/recomendacoes/gerar/{self.aluno_id}/")
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("CAT", resposta.data["erro"])

    def test_gerar_depois_de_o_cat_terminar(self):
        self._responder_todas()  # banco de 3 perguntas esgotado → CAT termina
        resposta = self.client.post(f"/api/recomendacoes/gerar/{self.aluno_id}/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(resposta.data[0]["curso_nome"], "Informática")

    def test_aluno_nao_gera_para_outro(self):
        resposta = self.client.post(f"/api/recomendacoes/gerar/{self.outro.id}/")
        self.assertEqual(resposta.status_code, status.HTTP_403_FORBIDDEN)

    def test_aluno_escolhe_um_curso(self):
        self._responder_todas()
        rec_id = self.client.post(f"/api/recomendacoes/gerar/{self.aluno_id}/").data[0]["id"]
        resposta = self.client.post(f"/api/recomendacoes/{rec_id}/escolher/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertTrue(Recomendacao.objects.get(pk=rec_id).escolhida_pelo_aluno)

    def test_escolher_outro_curso_desmarca_o_anterior(self):
        segundo = Curso.objects.create(nome="Electrónica", instituicao="ITEL", arquetipo_dominante="Analítico")
        VetorIdealCurso.objects.create(curso=segundo, disciplina="Matemática", peso_ideal=17)
        VetorIdealCurso.objects.create(curso=segundo, disciplina="Física", peso_ideal=18)
        self._responder_todas()
        recs = self.client.post(f"/api/recomendacoes/gerar/{self.aluno_id}/").data
        self.client.post(f"/api/recomendacoes/{recs[0]['id']}/escolher/")
        self.client.post(f"/api/recomendacoes/{recs[1]['id']}/escolher/")
        escolhidas = Recomendacao.objects.filter(aluno_id=self.aluno_id, escolhida_pelo_aluno=True)
        self.assertEqual(list(escolhidas.values_list("id", flat=True)), [recs[1]["id"]])

    def test_aluno_nao_escolhe_recomendacao_de_outro(self):
        rec = Recomendacao.objects.create(aluno=self.outro, curso=self.curso, score_academico=0.5,
                                          score_psicografico=0.5, score_final=0.5, rank=1)
        resposta = self.client.post(f"/api/recomendacoes/{rec.id}/escolher/")
        self.assertEqual(resposta.status_code, status.HTTP_404_NOT_FOUND)

    def test_aluno_nao_cria_recomendacao_a_mao(self):
        resposta = self.client.post("/api/recomendacoes/", {
            "aluno": self.aluno_id, "curso": self.curso.id, "score_academico": 1,
            "score_psicografico": 1, "score_final": 1, "rank": 1}, format="json")
        self.assertIn(resposta.status_code, NEGADO)


class OrientadorTest(APITestCase):

    def setUp(self):
        Aluno.objects.create(nome="A", idade=15, escola="X")
        Aluno.objects.create(nome="B", idade=15, escola="X")

    def test_login_devolve_token_e_da_acesso_a_todos_os_alunos(self):
        get_user_model().objects.create_user(username="prof", password="senha-forte-123", is_staff=True)
        resposta = self.client.post("/api/auth/login/", {"username": "prof", "password": "senha-forte-123"},
                                    format="json")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        cliente = APIClient()
        cliente.credentials(HTTP_AUTHORIZATION=f"Token {resposta.data['token']}")
        lista = cliente.get("/api/alunos/")
        self.assertEqual(lista.status_code, status.HTTP_200_OK)
        self.assertEqual(len(lista.data), 2)

    def test_utilizador_sem_staff_nao_tem_acesso(self):
        user = get_user_model().objects.create_user(username="comum", password="senha-forte-123")
        self.client.force_login(user)
        self.assertEqual(self.client.get("/api/alunos/").status_code, status.HTTP_403_FORBIDDEN)

    def test_orientador_ve_respostas_de_todos(self):
        autenticar_orientador(self.client)
        item = ItemCAT.objects.create(texto="P", tipo="nucleo", opcoes=OPCOES)
        for aluno in Aluno.objects.all():
            RespostaCAT.objects.create(aluno=aluno, item=item, arquetipo_escolhido="Criativo")
        self.assertEqual(len(self.client.get("/api/respostas-cat/").data), 2)


class SeedCursosTest(TestCase):

    def test_seed_e_idempotente_e_preserva_recomendacoes(self):
        call_command("seed_cursos", stdout=StringIO())
        ids = sorted(Curso.objects.values_list("id", flat=True))
        aluno = Aluno.objects.create(nome="A", idade=15, escola="X")
        Recomendacao.objects.create(aluno=aluno, curso=Curso.objects.first(), score_academico=0.5,
                                    score_psicografico=0.5, score_final=0.5, rank=1)

        call_command("seed_cursos", stdout=StringIO())

        self.assertEqual(Curso.objects.count(), 20)
        self.assertEqual(sorted(Curso.objects.values_list("id", flat=True)), ids)
        self.assertEqual(Recomendacao.objects.count(), 1)
        self.assertEqual(VetorIdealCurso.objects.count(), 20 * 12)
