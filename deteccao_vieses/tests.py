# deteccao_vieses/tests.py

from django.test import TestCase

from alunos.models import Aluno, NotaDisciplina
from cat.models import ItemCAT, RespostaCAT
from .services import detectar_vieses


OPCOES = [
    {"texto": "a", "arquetipo": "Analítico"}, {"texto": "b", "arquetipo": "Humanista"},
    {"texto": "c", "arquetipo": "Criativo"}, {"texto": "d", "arquetipo": "Estrategista"},
]


def _criar_aluno(notas):
    aluno = Aluno.objects.create(nome="Cientista Teste", idade=14, escola="Escola Teste")
    for disciplina, nota in notas.items():
        NotaDisciplina.objects.create(aluno=aluno, disciplina=disciplina, nota=nota)
    return aluno


def _responder(aluno, arquetipos):
    for arquetipo in arquetipos:
        item = ItemCAT.objects.create(texto="P", tipo="nucleo", opcoes=OPCOES)
        RespostaCAT.objects.create(aluno=aluno, item=item, arquetipo_escolhido=arquetipo)


FRACO_EM_ANALITICO = {
    "Matemática": 11, "Física": 12, "Química": 10,
    "Biologia": 16, "Português": 15, "Educação Moral e Cívica": 16,
    "Educação Visual": 15, "Educação Laboral": 16, "Língua Estrangeira": 15,
    "História": 15, "Geografia": 16, "Educação Física": 15,
}

FORTE_EM_ANALITICO = {
    "Matemática": 18, "Física": 17, "Química": 17,
    "Biologia": 14, "Português": 13, "Educação Moral e Cívica": 13,
    "Educação Visual": 12, "Educação Laboral": 12, "Língua Estrangeira": 13,
    "História": 12, "Geografia": 13, "Educação Física": 14,
}

# Perfil equilibrado (caso real testado: "Milton")
EQUILIBRADO = {
    "Matemática": 13, "Física": 15, "Química": 17,
    "Biologia": 15, "Português": 16, "Educação Moral e Cívica": 13,
    "Educação Visual": 15, "Educação Laboral": 16, "Língua Estrangeira": 13,
    "História": 14, "Geografia": 16, "Educação Física": 14,
}


class DetectarViesesTest(TestCase):
    """Testa a deteção de vieses cognitivos (RF09)."""

    def test_deteta_dunning_kruger_quando_cat_favorece_arquetipo_fraco(self):
        """Fraco em Analítico nas notas, mas o CAT aponta para Analítico → sobrestimação."""
        aluno = _criar_aluno(FRACO_EM_ANALITICO)
        _responder(aluno, ["Analítico"] * 6 + ["Humanista", "Criativo", "Estrategista", "Humanista"])

        resultado = detectar_vieses(aluno)
        self.assertIn("Analítico", resultado["sobrestimacao"])

    def test_deteta_sindrome_do_impostor_quando_aluno_ignora_o_seu_ponto_forte(self):
        """Forte em Analítico nas notas, mas nunca o escolhe no CAT → subestimação."""
        aluno = _criar_aluno(FORTE_EM_ANALITICO)
        _responder(aluno, ["Humanista", "Criativo", "Humanista", "Estrategista", "Criativo", "Humanista"])

        resultado = detectar_vieses(aluno)
        self.assertIn("Analítico", resultado["subestimacao"])

    def test_aluno_coerente_nao_gera_alertas(self):
        """Forte em Analítico e escolhe Analítico no CAT → sem alertas."""
        aluno = _criar_aluno(FORTE_EM_ANALITICO)
        _responder(aluno, ["Analítico"] * 3 + ["Humanista"] * 2)

        resultado = detectar_vieses(aluno)
        self.assertEqual(resultado, {"sobrestimacao": [], "subestimacao": []})

    def test_perfil_equilibrado_nao_gera_falsos_alertas(self):
        """
        Notas equilibradas: nenhum arquétipo é ponto forte ou fraco, por isso
        não há contradição a assinalar (o método antigo dava 3 alertas aqui).
        """
        aluno = _criar_aluno(EQUILIBRADO)
        _responder(aluno, ["Analítico"] * 4 + ["Humanista"] * 2)

        resultado = detectar_vieses(aluno)
        self.assertEqual(resultado, {"sobrestimacao": [], "subestimacao": []})

    def test_arquetipo_nao_escolhido_mas_mediano_nao_e_subestimacao(self):
        """Não escolher um arquétipo só é subestimação se ele for um ponto forte."""
        aluno = _criar_aluno(FORTE_EM_ANALITICO)
        _responder(aluno, ["Analítico"] * 5)

        resultado = detectar_vieses(aluno)
        self.assertNotIn("Humanista", resultado["subestimacao"])
        self.assertNotIn("Estrategista", resultado["subestimacao"])

    def test_sem_respostas_cat_levanta_erro(self):
        """Caso de erro: sem respostas ao CAT não é possível calcular VPC."""
        aluno = _criar_aluno(FRACO_EM_ANALITICO)
        with self.assertRaises(ValueError):
            detectar_vieses(aluno)

    def test_boletim_incompleto_levanta_erro(self):
        """Caso de erro: falta de nota impede o cálculo da força académica."""
        notas = dict(FRACO_EM_ANALITICO)
        del notas["Química"]
        aluno = _criar_aluno(notas)
        _responder(aluno, ["Analítico"])
        with self.assertRaises(ValueError):
            detectar_vieses(aluno)
