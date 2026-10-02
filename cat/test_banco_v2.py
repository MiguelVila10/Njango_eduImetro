# cat/test_banco_v2.py
"""Testes do banco v2 do CAT: carga, equilíbrio, itens activos e pares de coerência."""

from collections import Counter
from io import StringIO
import random

from django.core.management import call_command
from django.test import TestCase

from alunos.models import Aluno
from .management.commands.seed_itens_cat import BANCO_PROVISORIO
from .models import ItemCAT, RespostaCAT, validar_opcoes
from .services import (
    COERENTE,
    INCOERENTE,
    INDETERMINADA,
    avaliar_coerencia,
    estado_cat,
)

ARQUETIPOS = ["Analítico", "Humanista", "Criativo", "Estrategista"]


def _opcoes():
    return [{"texto": f"Opção {a}", "arquetipo": a} for a in ARQUETIPOS]


def _carregar():
    call_command("seed_itens_cat", stdout=StringIO())


class CargaDoBancoV2Test(TestCase):

    def test_carrega_20_itens_activos_equilibrados(self):
        _carregar()
        ativos = ItemCAT.objects.filter(ativo=True)
        self.assertEqual(ativos.count(), 20)
        self.assertEqual(Counter(ativos.values_list("tendencia", flat=True)),
                         Counter({a: 5 for a in ARQUETIPOS}))
        self.assertEqual(Counter(ativos.values_list("contexto", flat=True)),
                         Counter({c: 5 for c in ["Escola", "Família", "Bairro", "Amigos"]}))

    def test_tem_3_pares_de_coerencia_com_verificacao_no_segundo_membro(self):
        _carregar()
        for par in ["P1", "P2", "P3"]:
            membros = ItemCAT.objects.filter(par_coerencia=par).order_by("posicao")
            self.assertEqual([m.tipo for m in membros], ["nucleo", "verificacao"])

    def test_opcoes_tem_os_4_arquetipos_faceta_e_peso(self):
        _carregar()
        for item in ItemCAT.objects.filter(ativo=True):
            self.assertIsNone(validar_opcoes(item.opcoes))
            self.assertTrue(all("faceta" in o and o["peso"] == 1.0 for o in item.opcoes))

    def test_desactiva_banco_provisorio_sem_apagar_respostas(self):
        antigo = ItemCAT.objects.create(texto=BANCO_PROVISORIO[0], tipo="nucleo", opcoes=_opcoes())
        aluno = Aluno.objects.create(nome="A", idade=15, escola="X")
        RespostaCAT.objects.create(aluno=aluno, item=antigo, arquetipo_escolhido="Criativo")

        _carregar()

        antigo.refresh_from_db()
        self.assertFalse(antigo.ativo)
        self.assertEqual(RespostaCAT.objects.count(), 1)

    def test_pergunta_do_orientador_continua_activa(self):
        ItemCAT.objects.create(texto="Pergunta do orientador", tipo="nucleo", opcoes=_opcoes())
        _carregar()
        self.assertTrue(ItemCAT.objects.get(texto="Pergunta do orientador").ativo)

    def test_seed_duas_vezes_nao_duplica(self):
        _carregar()
        _carregar()
        self.assertEqual(ItemCAT.objects.count(), 20)


class ValidacaoOpcoesTest(TestCase):

    def test_peso_fora_do_intervalo_e_rejeitado(self):
        opcoes = _opcoes()
        opcoes[0]["peso"] = 1.5
        self.assertIsNotNone(validar_opcoes(opcoes))

    def test_opcao_sem_texto_e_rejeitada(self):
        opcoes = _opcoes()
        opcoes[1]["texto"] = "  "
        self.assertIsNotNone(validar_opcoes(opcoes))


class _RespostaFalsa:
    def __init__(self, par, escolha):
        self.item = type("Item", (), {"par_coerencia": par})()
        self.arquetipo_escolhido = escolha


class AvaliarCoerenciaTest(TestCase):

    def test_sem_pares_completos_e_indeterminada(self):
        r = avaliar_coerencia([_RespostaFalsa("P1", "Analítico")])
        self.assertEqual(r["resultado"], INDETERMINADA)

    def test_dois_de_tres_pares_coincidentes_e_normal(self):
        respostas = [
            _RespostaFalsa("P1", "Analítico"), _RespostaFalsa("P1", "Analítico"),
            _RespostaFalsa("P2", "Humanista"), _RespostaFalsa("P2", "Humanista"),
            _RespostaFalsa("P3", "Criativo"), _RespostaFalsa("P3", "Analítico"),
        ]
        r = avaliar_coerencia(respostas)
        self.assertEqual((r["pares_avaliados"], r["pares_coincidentes"], r["resultado"]),
                         (3, 2, COERENTE))

    def test_um_de_tres_pares_coincidente_e_baixa(self):
        respostas = [
            _RespostaFalsa("P1", "Analítico"), _RespostaFalsa("P1", "Criativo"),
            _RespostaFalsa("P2", "Humanista"), _RespostaFalsa("P2", "Estrategista"),
            _RespostaFalsa("P3", "Criativo"), _RespostaFalsa("P3", "Criativo"),
        ]
        self.assertEqual(avaliar_coerencia(respostas)["resultado"], INCOERENTE)


class CATComBancoV2Test(TestCase):

    def setUp(self):
        _carregar()
        self.aluno = Aluno.objects.create(nome="A", idade=15, escola="X")

    def _responder_ate_terminar(self, escolher):
        servidos = []
        rng = random.Random(3)
        for _ in range(40):
            estado = estado_cat(self.aluno, rng=rng)
            if estado["terminado"]:
                return estado, servidos
            item = estado["item"]
            servidos.append(item)
            RespostaCAT.objects.create(aluno=self.aluno, item=item, arquetipo_escolhido=escolher(item))
        self.fail("O CAT não terminou.")

    def test_nunca_serve_itens_inactivos(self):
        ItemCAT.objects.filter(tendencia="Analítico").update(ativo=False)
        _, servidos = self._responder_ate_terminar(lambda item: "Humanista")
        self.assertTrue(all(i.ativo for i in servidos))

    def test_verificacao_so_aparece_depois_do_primeiro_membro_do_par(self):
        _, servidos = self._responder_ate_terminar(lambda item: "Analítico")
        vistos = set()
        for item in servidos:
            if item.tipo == "verificacao":
                self.assertIn(item.par_coerencia, vistos)
            if item.par_coerencia:
                vistos.add(item.par_coerencia)

    def test_nao_termina_com_par_aberto(self):
        estado, servidos = self._responder_ate_terminar(lambda item: "Analítico")
        pares = Counter(i.par_coerencia for i in servidos if i.par_coerencia)
        self.assertTrue(all(n == 2 for n in pares.values()), pares)
        self.assertEqual(estado["coerencia"]["pares_avaliados"], len(pares))

    def test_aluno_consistente_termina_com_o_arquetipo_certo(self):
        estado, _ = self._responder_ate_terminar(lambda item: "Criativo")
        self.assertEqual(estado["arquetipo_provavel"], "Criativo")
        self.assertEqual(estado["motivo"], "perfil_identificado")
