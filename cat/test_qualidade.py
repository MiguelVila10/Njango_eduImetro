# cat/test_qualidade.py
"""
Testes da qualidade das respostas (tempo, posição no ecrã, coerência),
da repetição única do CAT e das opções sem arquétipo para o aluno.
"""

from rest_framework import status
from rest_framework.test import APITestCase

from alunos.apoio_testes import autenticar_aluno, autenticar_orientador
from alunos.models import Aluno, NotaDisciplina
from cursos.models import Curso, VetorIdealCurso
from recomendacoes.models import Recomendacao
from .models import ItemCAT, RespostaCAT
from .services import CONFIANCA_BAIXA, CONFIANCA_NORMAL, estado_cat

ARQUETIPOS = ["Analítico", "Humanista", "Criativo", "Estrategista"]
NOTAS = {
    "Matemática": 18, "Física": 17, "Química": 16, "Biologia": 14, "Português": 13,
    "Educação Moral e Cívica": 14, "Educação Visual": 13, "Educação Laboral": 14,
    "Língua Estrangeira": 13, "História": 13, "Geografia": 14, "Educação Física": 13,
}


def _opcoes():
    return [{"texto": f"Opção {a}", "arquetipo": a} for a in ARQUETIPOS]


class QualidadeEdRepeticaoTest(APITestCase):

    def setUp(self):
        self.itens = [ItemCAT.objects.create(texto=f"P{i}", tipo="nucleo", opcoes=_opcoes()) for i in range(12)]
        self.aluno = Aluno.objects.create(nome="A", idade=15, escola="X")
        for disciplina, nota in NOTAS.items():
            NotaDisciplina.objects.create(aluno=self.aluno, disciplina=disciplina, nota=nota)
        curso = Curso.objects.create(nome="Informática", instituicao="ITEL", arquetipo_dominante="Analítico")
        VetorIdealCurso.objects.create(curso=curso, disciplina="Matemática", peso_ideal=18)
        VetorIdealCurso.objects.create(curso=curso, disciplina="Português", peso_ideal=12)
        autenticar_aluno(self.client, self.aluno)

    def _responder(self, n, tempo, posicao):
        for item in self.itens[:n]:
            RespostaCAT.objects.create(aluno=self.aluno, item=item, arquetipo_escolhido="Analítico",
                                       tempo_resposta_ms=tempo, posicao_ecra=posicao)

    def test_aluno_regista_data_de_inicio(self):
        self.assertIsNotNone(self.aluno.criado_em)

    def test_respostas_calmas_tem_confianca_normal(self):
        self._responder(8, tempo=9000, posicao="")
        estado = estado_cat(self.aluno)
        self.assertEqual(estado["confianca"]["nivel"], CONFIANCA_NORMAL)
        self.assertFalse(estado["pode_repetir"])

    def test_um_so_indicador_nao_baixa_a_confianca(self):
        self._responder(8, tempo=500, posicao="")  # só o tempo falha
        self.assertEqual(estado_cat(self.aluno)["confianca"]["nivel"], CONFIANCA_NORMAL)

    def test_respostas_apressadas_e_mecanicas_tem_confianca_baixa(self):
        self._responder(8, tempo=500, posicao="A")
        estado = estado_cat(self.aluno)
        self.assertTrue(estado["terminado"])
        self.assertEqual(estado["confianca"]["nivel"], CONFIANCA_BAIXA)
        self.assertEqual(len(estado["confianca"]["motivos"]), 2)
        self.assertTrue(estado["pode_repetir"])

    def test_recomendacao_guarda_a_confianca(self):
        self._responder(8, tempo=500, posicao="A")
        resposta = self.client.post(f"/api/recomendacoes/gerar/{self.aluno.id}/")
        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        # O aluno não vê a confiança; fica gravada para o orientador.
        self.assertNotIn("confianca_cat", resposta.data[0])
        rec = Recomendacao.objects.get(pk=resposta.data[0]["id"])
        self.assertEqual(rec.confianca_cat["nivel"], CONFIANCA_BAIXA)

    def test_nao_repete_com_confianca_normal(self):
        self._responder(8, tempo=9000, posicao="")
        resposta = self.client.post(f"/api/cat/repetir/{self.aluno.id}/")
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_repete_uma_vez_e_guarda_a_primeira_tentativa(self):
        self._responder(8, tempo=500, posicao="A")
        self.client.post(f"/api/recomendacoes/gerar/{self.aluno.id}/")

        resposta = self.client.post(f"/api/cat/repetir/{self.aluno.id}/")

        self.assertEqual(resposta.status_code, status.HTTP_200_OK)
        self.assertEqual(resposta.data["tentativa"], 2)
        self.assertEqual(resposta.data["respondidas"], 0)
        self.assertEqual(RespostaCAT.objects.filter(aluno=self.aluno, tentativa=1).count(), 8)
        self.assertFalse(Recomendacao.objects.filter(aluno=self.aluno).exists())

    def test_na_segunda_tentativa_pode_responder_a_mesma_pergunta(self):
        self._responder(8, tempo=500, posicao="A")
        self.client.post(f"/api/cat/repetir/{self.aluno.id}/")
        resposta = self.client.post("/api/respostas-cat/", {"aluno": self.aluno.id, "item": self.itens[0].id,
                                                            "opcao": 1}, format="json")
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resposta.data["tentativa"], 2)

    def test_so_se_repete_uma_vez(self):
        self._responder(8, tempo=500, posicao="A")
        self.client.post(f"/api/cat/repetir/{self.aluno.id}/")
        self.aluno.refresh_from_db()
        for item in self.itens[:8]:
            RespostaCAT.objects.create(aluno=self.aluno, item=item, arquetipo_escolhido="Analítico",
                                       tempo_resposta_ms=500, posicao_ecra="A", tentativa=2)
        resposta = self.client.post(f"/api/cat/repetir/{self.aluno.id}/")
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_aluno_nao_repete_pelo_outro(self):
        outro = Aluno.objects.create(nome="B", idade=15, escola="X")
        resposta = self.client.post(f"/api/cat/repetir/{outro.id}/")
        self.assertEqual(resposta.status_code, status.HTTP_403_FORBIDDEN)


class OpcoesSemArquetipoTest(APITestCase):

    def setUp(self):
        self.item = ItemCAT.objects.create(texto="P", tipo="nucleo", tendencia="Criativo", opcoes=_opcoes())
        ItemCAT.objects.create(texto="Q", tipo="nucleo", opcoes=_opcoes())
        self.aluno = Aluno.objects.create(nome="A", idade=15, escola="X")

    def test_aluno_recebe_opcoes_sem_arquetipo_nem_crenca(self):
        autenticar_aluno(self.client, self.aluno)
        dados = self.client.get(f"/api/cat/proxima/{self.aluno.id}/").data
        self.assertNotIn("crenca", dados)
        self.assertNotIn("tendencia", dados["item"])
        self.assertEqual([o["posicao"] for o in dados["item"]["opcoes"]], list("ABCD"))
        self.assertTrue(all(set(o) == {"opcao", "texto", "posicao"} for o in dados["item"]["opcoes"]))

    def test_ordem_baralhada_e_estavel_para_o_mesmo_aluno(self):
        autenticar_aluno(self.client, self.aluno)
        a = self.client.get(f"/api/cat/proxima/{self.aluno.id}/").data["item"]
        b = self.client.get(f"/api/cat/proxima/{self.aluno.id}/").data["item"]
        self.assertEqual(a, b)

    def test_orientador_ve_a_versao_completa(self):
        autenticar_orientador(self.client)
        dados = self.client.get(f"/api/cat/proxima/{self.aluno.id}/").data
        self.assertIn("crenca", dados)
        self.assertIn("arquetipo", dados["item"]["opcoes"][0])

    def test_opcao_e_convertida_no_arquetipo_certo(self):
        autenticar_aluno(self.client, self.aluno)
        resposta = self.client.post("/api/respostas-cat/", {"aluno": self.aluno.id, "item": self.item.id,
                                                            "opcao": 2}, format="json")
        self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(resposta.data["arquetipo_escolhido"], "Criativo")

    def test_opcao_invalida_ou_em_falta_e_rejeitada(self):
        autenticar_aluno(self.client, self.aluno)
        r1 = self.client.post("/api/respostas-cat/", {"aluno": self.aluno.id, "item": self.item.id,
                                                      "opcao": 7}, format="json")
        r2 = self.client.post("/api/respostas-cat/", {"aluno": self.aluno.id, "item": self.item.id},
                              format="json")
        self.assertEqual(r1.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(r2.status_code, status.HTTP_400_BAD_REQUEST)

    def test_pergunta_inactiva_nao_aceita_respostas(self):
        self.item.ativo = False
        self.item.save()
        autenticar_aluno(self.client, self.aluno)
        resposta = self.client.post("/api/respostas-cat/", {"aluno": self.aluno.id, "item": self.item.id,
                                                            "opcao": 0}, format="json")
        self.assertEqual(resposta.status_code, status.HTTP_400_BAD_REQUEST)
