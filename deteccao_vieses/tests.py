from django.test import TestCase

# Create your tests here.
from django.test import TestCase

from alunos.models import Aluno, NotaDisciplina
from cat.models import ItemCAT, RespostaCAT
from .services import detectar_vieses


class DetectarViesesTest(TestCase):
    """Testa a deteção de vieses cognitivos (RF09)."""

    def setUp(self):
        self.aluno = Aluno.objects.create(nome="Cientista Teste", idade=14, escola="Escola Teste")
        # Boletim: fraco em Analítico, forte nas outras (para focar o teste no arquétipo Analítico)
        for disciplina, nota in [
            ("Matemática", 11), ("Física", 12), ("Química", 10),
            ("Biologia", 16), ("Português", 15), ("Educação Moral e Cívica", 16),
            ("Educação Visual", 15), ("Educação Laboral", 16), ("Língua Estrangeira", 15),
            ("História", 15), ("Geografia", 16), ("Educação Física", 15),
        ]:
            NotaDisciplina.objects.create(aluno=self.aluno, disciplina=disciplina, nota=nota)

        self.item = ItemCAT.objects.create(texto="Pergunta", tipo="nucleo", opcoes=[
            {"texto": "a", "arquetipo": "Analítico"}, {"texto": "b", "arquetipo": "Humanista"},
            {"texto": "c", "arquetipo": "Criativo"}, {"texto": "d", "arquetipo": "Estrategista"},
        ])

    def test_deteta_dunning_kruger_quando_cat_favorece_arquetipo_fraco(self):
        """Happy path: aluno fraco em Analítico mas CAT aponta fortemente para Analítico → sobrestimação."""
        for _ in range(6):
            item = ItemCAT.objects.create(texto="P", tipo="nucleo", opcoes=self.item.opcoes)
            RespostaCAT.objects.create(aluno=self.aluno, item=item, arquetipo_escolhido="Analítico")
        for arquetipo in ["Humanista", "Criativo", "Estrategista", "Humanista"]:
            item = ItemCAT.objects.create(texto="P", tipo="nucleo", opcoes=self.item.opcoes)
            RespostaCAT.objects.create(aluno=self.aluno, item=item, arquetipo_escolhido=arquetipo)

        resultado = detectar_vieses(self.aluno)
        self.assertIn("Analítico", resultado["sobrestimacao"])

    def test_sem_respostas_cat_levanta_erro(self):
        """Caso de erro: sem respostas ao CAT não é possível calcular VPC."""
        with self.assertRaises(ValueError):
            detectar_vieses(self.aluno)