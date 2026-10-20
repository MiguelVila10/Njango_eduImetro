# alunos/test_dados_demo.py

from io import StringIO

from django.core.management import call_command
from django.test import TestCase

from alunos.estado import SEM_CURSO_COMPATIVEL, carregar_cursos, estado_do_aluno
from alunos.management.commands.dados_demo import ESCOLA_DEMO, PERFIS
from alunos.models import Aluno
from recomendacoes.models import Recomendacao


class DadosDemoTest(TestCase):

    def setUp(self):
        call_command("seed_cursos", stdout=StringIO())
        call_command("seed_itens_cat", stdout=StringIO())
        self.real = Aluno.objects.create(nome="Aluno real", idade=15, escola="Escola X")

    def _correr(self, *args):
        call_command("dados_demo", *args, stdout=StringIO())

    def test_cria_alunos_pelo_motor_verdadeiro(self):
        self._correr()
        demo = Aluno.objects.filter(escola=ESCOLA_DEMO)
        self.assertEqual(demo.count(), len(PERFIS))
        # Cada aluno com sugestões tem 1 a 3, geradas pelo motor (scores entre 0 e 1).
        for rec in Recomendacao.objects.filter(aluno__in=demo):
            self.assertTrue(0 <= rec.score_final <= 1)
        cursos = carregar_cursos()
        estados = [estado_do_aluno(a, cursos) for a in demo.prefetch_related("recomendacoes", "respostas_cat", "notas")]
        self.assertIn(SEM_CURSO_COMPATIVEL, estados)

    def test_correr_duas_vezes_nao_duplica(self):
        self._correr()
        self._correr()
        self.assertEqual(Aluno.objects.filter(escola=ESCOLA_DEMO).count(), len(PERFIS))

    def test_apagar_so_remove_os_de_demonstracao(self):
        self._correr()
        self._correr("--apagar")
        self.assertFalse(Aluno.objects.filter(escola=ESCOLA_DEMO).exists())
        self.assertTrue(Aluno.objects.filter(pk=self.real.pk).exists())


class DadosDemoBaseVaziaTest(TestCase):
    def test_base_vazia_carrega_cursos_e_perguntas(self):
        call_command("dados_demo", stdout=StringIO())
        self.assertEqual(Aluno.objects.filter(escola=ESCOLA_DEMO).count(), len(PERFIS))
