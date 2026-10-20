# alunos/management/commands/dados_demo.py
"""
Cria alunos de DEMONSTRAÇÃO para apresentar o sistema (ex.: na defesa),
para o painel do orientador não aparecer vazio.

Os alunos passam pelo motor verdadeiro: notas → teste adaptativo (as
respostas são simuladas segundo um perfil escolhido) → filtro SE-ENTÃO →
similaridade → vieses → sugestões. Nada é escrito à mão nas sugestões.

Todos ficam com a escola "Escola de demonstração", para se distinguirem
dos alunos reais e poderem ser apagados de uma vez.

Atenção: são dados de demonstração. Não servem como resultados de testes
com utilizadores reais e não devem ser apresentados como tal.

Uso:
    python manage.py dados_demo            # cria (ou recria) os alunos de demonstração
    python manage.py dados_demo --apagar   # apaga só os alunos de demonstração
"""

import random

from django.core.management import call_command
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from alunos.models import Aluno, NotaDisciplina
from alunos.views import DISCIPLINAS_OBRIGATORIAS
from cat import motor
from cat.models import ItemCAT, RespostaCAT
from cat.serializers import item_para_aluno
from cat.services import estado_cat
from cursos.models import Curso
from recomendacoes.services import SemCursosCompativeis, gerar_recomendacoes

ESCOLA_DEMO = "Escola de demonstração"

# Ordem das notas: a de DISCIPLINAS_OBRIGATORIAS
# (Português, Matemática, Física, Química, Biologia, História, Geografia,
#  Língua Estrangeira, Ed. Moral e Cívica, Ed. Física, Ed. Visual, Ed. Laboral)
PERFIS = [
    # nome, idade, notas, arquétipo "verdadeiro", modo de responder, confirma escolha?
    ("Ana Kiala", 15, [14, 18, 17, 16, 14, 13, 13, 14, 14, 13, 12, 14], "Analítico", "atento", True),
    ("Bento Ngola", 14, [15, 13, 12, 12, 14, 15, 14, 16, 16, 13, 18, 15], "Criativo", "atento", True),
    ("Carla Mbala", 15, [16, 14, 14, 17, 18, 13, 13, 14, 15, 15, 12, 13], "Humanista", "atento", False),
    ("Délcio Tavares", 16, [16, 17, 13, 13, 12, 16, 15, 15, 14, 14, 12, 13], "Estrategista", "atento", True),
    ("Esperança Lukamba", 14, [17, 13, 12, 12, 13, 17, 15, 16, 16, 14, 14, 14], "Humanista", "atento", False),
    ("Fábio Cassoma", 15, [13, 16, 17, 14, 12, 12, 12, 13, 13, 14, 15, 17], "Analítico", "apressado", False),
    ("Graça Muteka", 15, [11, 11, 11, 12, 12, 12, 11, 12, 12, 13, 12, 12], "Criativo", "atento", False),
]


def _escolher_opcao(rng, item, arquetipo_real, modo, opcoes_ecra):
    """Devolve a opção do ecrã ({opcao, posicao}) que o aluno simulado escolhe."""
    if modo == "apressado":
        return opcoes_ecra[0]  # carrega sempre na primeira (posição A)
    matriz = motor.matriz_probabilidades(item.tendencia)
    pesos = []
    for o in opcoes_ecra:
        arquetipo_opcao = item.opcoes[o["opcao"]]["arquetipo"]
        pesos.append(matriz[arquetipo_opcao][arquetipo_real])
    return rng.choices(opcoes_ecra, weights=pesos, k=1)[0]


class Command(BaseCommand):
    help = "Cria (ou apaga, com --apagar) alunos de demonstração que passam pelo motor verdadeiro."

    def add_arguments(self, parser):
        parser.add_argument("--apagar", action="store_true", help="Apaga só os alunos de demonstração.")
        parser.add_argument("--seed", type=int, default=2026, help="Semente para respostas reprodutíveis.")

    def handle(self, *args, **opts):
        apagados, _ = Aluno.objects.filter(escola=ESCOLA_DEMO).delete()
        if opts["apagar"]:
            self.stdout.write(self.style.SUCCESS(f"Alunos de demonstração apagados ({apagados} registos)."))
            return

        # Base vazia (primeira vez): carrega os cursos e as perguntas de origem.
        # Se já existirem, não se tocam (para não desfazer edições do orientador).
        if not Curso.objects.exists():
            call_command("seed_cursos", stdout=self.stdout)
        if not ItemCAT.objects.filter(ativo=True).exists():
            call_command("seed_itens_cat", stdout=self.stdout)
        if not Curso.objects.exists() or not ItemCAT.objects.filter(ativo=True).exists():
            raise CommandError("Não foi possível carregar os cursos e as perguntas.")

        rng = random.Random(opts["seed"])
        for nome, idade, notas, arquetipo, modo, confirma in PERFIS:
            with transaction.atomic():
                resumo = self._criar(rng, nome, idade, notas, arquetipo, modo, confirma)
            self.stdout.write(f"  {nome}: {resumo}")
        self.stdout.write(self.style.SUCCESS(
            f"{len(PERFIS)} alunos de demonstração criados (escola: \"{ESCOLA_DEMO}\")."
        ))

    def _criar(self, rng, nome, idade, notas, arquetipo, modo, confirma):
        aluno = Aluno.objects.create(nome=nome, idade=idade, escola=ESCOLA_DEMO)
        NotaDisciplina.objects.bulk_create(
            NotaDisciplina(aluno=aluno, disciplina=d, nota=n)
            for d, n in zip(DISCIPLINAS_OBRIGATORIAS, notas)
        )

        estado = estado_cat(aluno, rng=rng)
        while not estado["terminado"]:
            item = estado["item"]
            opcoes_ecra = item_para_aluno(item, aluno)["opcoes"]
            escolhida = _escolher_opcao(rng, item, arquetipo, modo, opcoes_ecra)
            RespostaCAT.objects.create(
                aluno=aluno, item=item, tentativa=aluno.tentativa_cat,
                arquetipo_escolhido=item.opcoes[escolhida["opcao"]]["arquetipo"],
                tempo_resposta_ms=rng.randint(700, 1500) if modo == "apressado" else rng.randint(6000, 14000),
                posicao_ecra=escolhida["posicao"],
            )
            estado = estado_cat(aluno, rng=rng)

        try:
            recs = gerar_recomendacoes(aluno, confianca=estado["confianca"])
        except SemCursosCompativeis:
            return f"{estado['respondidas']} perguntas, sem curso compatível"

        if confirma:
            recs[0].escolhida_pelo_aluno = True
            recs[0].save(update_fields=["escolhida_pelo_aluno"])
        return (
            f"{estado['respondidas']} perguntas, confiança {estado['confianca']['nivel']}, "
            f"1.ª sugestão: {recs[0].curso.nome}" + (" (escolhida)" if confirma else "")
        )
