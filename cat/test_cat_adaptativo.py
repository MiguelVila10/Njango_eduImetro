# cat/test_cat_adaptativo.py
"""Testes do CAT adaptativo: motor, serviço, endpoint, seed e simulação."""

import random
from alunos.apoio_testes import autenticar_aluno, autenticar_orientador
from io import StringIO

from django.core.management import call_command
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from alunos.models import Aluno
from . import motor
from .models import ItemCAT, RespostaCAT
from .services import estado_cat


def _opcoes():
    return [{"texto": f"Opção {a}", "arquetipo": a} for a in motor.ARQUETIPOS]


class MatrizProbabilidadesTest(TestCase):
    """Calibração sintética."""

    def test_cada_arquetipo_soma_100_por_cento(self):
        for tendencia in [None, "neutra"] + motor.ARQUETIPOS:
            matriz = motor.matriz_probabilidades(tendencia)
            for aluno in motor.ARQUETIPOS:
                total = sum(matriz[opcao][aluno] for opcao in motor.ARQUETIPOS)
                self.assertAlmostEqual(total, 1.0)

    def test_aluno_prefere_a_opcao_do_seu_arquetipo_em_pergunta_neutra(self):
        matriz = motor.matriz_probabilidades("neutra")
        for aluno in motor.ARQUETIPOS:
            propria = matriz[aluno][aluno]
            for opcao in motor.ARQUETIPOS:
                if opcao != aluno:
                    self.assertGreater(propria, matriz[opcao][aluno])

    def test_tendencia_torna_a_opcao_atractiva_para_todos(self):
        neutra = motor.matriz_probabilidades("neutra")
        humanista = motor.matriz_probabilidades("Humanista")
        for aluno in motor.ARQUETIPOS:
            self.assertGreater(humanista["Humanista"][aluno], neutra["Humanista"][aluno])


class CrencaTest(TestCase):
    """Actualização bayesiana da crença."""

    def test_sem_respostas_a_crenca_e_uniforme(self):
        crenca = motor.calcular_crenca([])
        for a in motor.ARQUETIPOS:
            self.assertAlmostEqual(crenca[a], 0.25)

    def test_resposta_aumenta_a_crenca_no_arquetipo_escolhido(self):
        crenca = motor.calcular_crenca([("neutra", "Criativo")])
        self.assertGreater(crenca["Criativo"], 0.25)
        self.assertAlmostEqual(sum(crenca.values()), 1.0)

    def test_escolha_contraria_a_tendencia_pesa_mais_que_a_esperada(self):
        """Escolher Analítico numa situação que puxa para Humanista revela mais do que escolher Humanista."""
        contraria = motor.calcular_crenca([("Humanista", "Analítico")])
        esperada = motor.calcular_crenca([("Humanista", "Humanista")])
        self.assertGreater(contraria["Analítico"], esperada["Humanista"])

    def test_arquetipo_desconhecido_e_rejeitado(self):
        with self.assertRaises(ValueError):
            motor.atualizar_crenca(motor.crenca_inicial(), "neutra", "Artístico")


class ParagemTest(TestCase):
    """Regras de paragem."""

    def test_nao_para_antes_do_minimo_mesmo_com_certeza_alta(self):
        crenca = {"Analítico": 0.97, "Humanista": 0.01, "Criativo": 0.01, "Estrategista": 0.01}
        self.assertIsNone(motor.decidir_paragem(crenca, motor.MIN_PERGUNTAS - 1, 10))

    def test_para_quando_atinge_a_certeza_depois_do_minimo(self):
        crenca = {"Analítico": 0.90, "Humanista": 0.04, "Criativo": 0.03, "Estrategista": 0.03}
        self.assertEqual(motor.decidir_paragem(crenca, motor.MIN_PERGUNTAS, 10), motor.MOTIVO_PERFIL)

    def test_para_no_maximo_de_perguntas(self):
        self.assertEqual(
            motor.decidir_paragem(motor.crenca_inicial(), motor.MAX_PERGUNTAS, 10), motor.MOTIVO_MAXIMO
        )

    def test_para_quando_o_banco_se_esgota(self):
        self.assertEqual(motor.decidir_paragem(motor.crenca_inicial(), 2, 0), motor.MOTIVO_BANCO)


class EscolhaItemTest(TestCase):
    """Selecção da próxima pergunta (máxima informação)."""

    def test_sem_candidatos_devolve_none(self):
        self.assertIsNone(motor.escolher_item(motor.crenca_inicial(), []))

    def test_escolhe_sempre_um_candidato(self):
        candidatos = [(10, "neutra"), (11, "Humanista"), (12, "Criativo")]
        escolhido = motor.escolher_item(motor.crenca_inicial(), candidatos, rng=random.Random(1))
        self.assertIn(escolhido, [10, 11, 12])

    def test_no_inicio_prefere_pergunta_neutra(self):
        candidatos = [(1, "Humanista"), (2, "neutra"), (3, "Analítico")]
        self.assertEqual(motor.escolher_item(motor.crenca_inicial(), candidatos, rng=random.Random(1)), 2)

    def test_a_escolha_depende_das_respostas_anteriores(self):
        """Adaptatividade: com crença inicial escolhe a neutra; com crença Analítica forte escolhe outra."""
        candidatos = [(1, "neutra"), (2, "Analítico"), (3, "Humanista")]
        inicio = motor.escolher_item(motor.crenca_inicial(), candidatos, rng=random.Random(1))
        crenca = motor.calcular_crenca([("neutra", "Analítico"), ("neutra", "Analítico")])
        depois = motor.escolher_item(crenca, candidatos, rng=random.Random(1))
        self.assertEqual(inicio, 1)
        self.assertNotEqual(inicio, depois)


class EstadoCATServiceTest(TestCase):
    """Serviço que liga o motor à base de dados."""

    def setUp(self):
        self.aluno = Aluno.objects.create(nome="Aluno CAT", idade=15, escola="Escola Teste")
        self.itens = [
            ItemCAT.objects.create(texto=f"Pergunta {i}", tipo="nucleo", tendencia="neutra", opcoes=_opcoes())
            for i in range(8)
        ]

    def test_primeira_chamada_devolve_uma_pergunta(self):
        estado = estado_cat(self.aluno, rng=random.Random(0))
        self.assertFalse(estado["terminado"])
        self.assertEqual(estado["respondidas"], 0)
        self.assertIsNotNone(estado["item"])

    def test_pergunta_ja_respondida_nao_se_repete(self):
        RespostaCAT.objects.create(aluno=self.aluno, item=self.itens[0], arquetipo_escolhido="Analítico")
        for seed in range(10):
            estado = estado_cat(self.aluno, rng=random.Random(seed))
            self.assertNotEqual(estado["item"].id, self.itens[0].id)

    def test_respostas_coerentes_terminam_com_perfil_identificado(self):
        for item in self.itens[:6]:
            RespostaCAT.objects.create(aluno=self.aluno, item=item, arquetipo_escolhido="Estrategista")
        estado = estado_cat(self.aluno)
        self.assertTrue(estado["terminado"])
        self.assertEqual(estado["motivo"], motor.MOTIVO_PERFIL)
        self.assertEqual(estado["arquetipo_provavel"], "Estrategista")
        self.assertIsNone(estado["item"])


class ProximaPerguntaEndpointTest(APITestCase):
    """GET /api/cat/proxima/{aluno_id}/"""

    def setUp(self):
        autenticar_orientador(self.client)
        self.aluno = Aluno.objects.create(nome="Aluno API", idade=15, escola="Escola Teste")
        for i in range(6):
            ItemCAT.objects.create(texto=f"Pergunta {i}", tipo="nucleo", tendencia="neutra", opcoes=_opcoes())

    def test_aluno_inexistente_devolve_404(self):
        response = self.client.get("/api/cat/proxima/9999/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_devolve_pergunta_e_crenca(self):
        response = self.client.get(f"/api/cat/proxima/{self.aluno.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data["terminado"])
        self.assertIn("tendencia", response.data["item"])
        self.assertEqual(len(response.data["item"]["opcoes"]), 4)
        self.assertEqual(set(response.data["crenca"]), set(motor.ARQUETIPOS))

    def test_fluxo_completo_ate_terminar(self):
        """Simula o frontend: pede pergunta, responde, repete até o CAT terminar."""
        self.client.logout()
        autenticar_aluno(self.client, self.aluno)
        for _ in range(10):
            dados = self.client.get(f"/api/cat/proxima/{self.aluno.id}/").data
            if dados["terminado"]:
                break
            resposta = self.client.post(
                "/api/respostas-cat/",
                {"aluno": self.aluno.id, "item": dados["item"]["id"], "arquetipo_escolhido": "Humanista"},
                format="json",
            )
            self.assertEqual(resposta.status_code, status.HTTP_201_CREATED)
        self.assertTrue(dados["terminado"])
        self.assertEqual(dados["arquetipo_provavel"], "Humanista")


class SeedItensCATTest(TestCase):
    """O seed é idempotente e não apaga perguntas do orientador."""

    def test_seed_duas_vezes_nao_duplica(self):
        call_command("seed_itens_cat", stdout=StringIO())
        total = ItemCAT.objects.count()
        call_command("seed_itens_cat", stdout=StringIO())
        self.assertEqual(ItemCAT.objects.count(), total)

    def test_seed_preserva_pergunta_criada_no_admin(self):
        ItemCAT.objects.create(texto="Pergunta do orientador", tipo="nucleo", opcoes=_opcoes())
        call_command("seed_itens_cat", stdout=StringIO())
        self.assertTrue(ItemCAT.objects.filter(texto="Pergunta do orientador").exists())


class SimulacaoCATTest(TestCase):
    """Comando de simulação com alunos sintéticos."""

    def test_simulacao_corre_e_mostra_resultados(self):
        call_command("seed_itens_cat", stdout=StringIO())
        saida = StringIO()
        call_command("simular_cat", "--alunos", "50", "--seed", "1", stdout=saida)
        self.assertIn("Precisão", saida.getvalue())
