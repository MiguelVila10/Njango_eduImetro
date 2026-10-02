# cat/management/commands/seed_itens_cat.py
"""
Povoa o banco de itens do CAT (RF04, RF05) com o banco v2 (cat/dados/banco_cat_v2.json):
20 itens situacionais, 5 por tendência e 5 por contexto, com 3 pares de coerência.

O comando é idempotente e NÃO apaga perguntas:
- cria ou actualiza os itens do banco v2 (identificados pelo código, ex.: AN-01);
- desactiva (ativo=False) as perguntas do banco provisório antigo, para não
  entrarem no CAT, mas preserva-as com as respostas dos alunos;
- não toca nas perguntas cadastradas pelo orientador no Admin.
"""

import json
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction

from cat.models import ItemCAT

FICHEIRO_BANCO = Path(__file__).resolve().parents[2] / "dados" / "banco_cat_v2.json"

ARQUETIPOS = {"AN": "Analítico", "HU": "Humanista", "CR": "Criativo", "ES": "Estrategista"}

# Enunciados do banco provisório (versão de desenvolvimento), a desactivar.
BANCO_PROVISORIO = [
    'Num trabalho de grupo, qual destas tarefas preferes assumir?',
    'Quando surge um problema difícil, qual é a tua primeira reacção?',
    'Nos tempos livres, qual destas actividades escolherias?',
    'Se pudesses escolher uma disciplina extra na escola, qual seria?',
    'Como preferes aprender uma matéria nova?',
    'Numa competição desportiva, o que mais te motiva?',
    'Qual destas profissões te desperta mais curiosidade?',
    'Quando lês uma notícia importante, o que mais te interessa saber?',
    'Se tivesses de organizar uma festa de turma, qual seria o teu papel preferido?',
    'Qual destas frases descreve melhor a forma como tomas decisões?',
    'Numa visita de estudo, o que mais gostarias de explorar?',
    'Se pudesses resolver um problema do mundo, qual escolherias?',
    'Como reages quando um plano não corre como esperado?',
    'Qual destes tipos de livro ou filme preferes?',
    'Num debate na sala de aula, que papel assumes mais naturalmente?',
    'O que mais valorizas ao escolher um curso técnico?',
    'Qual destas actividades escolares te dá mais satisfação ao terminar?',
    'Se tivesses de escolher um clube extracurricular, qual seria?',
    'O que mais admiras numa pessoa que consideras bem-sucedida?',
    'Numa tarde livre sem compromissos, o que provavelmente farias?',
    'Duas pessoas do teu grupo estão chateadas uma com a outra. O que farias para resolver a situação?',
]


def converter_item(dados):
    """Converte um item do ficheiro (códigos AN/HU/CR/ES) para o formato do modelo."""
    return {
        "texto": dados["texto"],
        "tipo": dados["tipo"],
        "tendencia": ARQUETIPOS[dados["tendencia"]],
        "contexto": dados["contexto"],
        "posicao": dados["posicao"],
        "par_coerencia": dados["par_coerencia"] or "",
        "ativo": True,
        "opcoes": [
            {
                "texto": o["texto"],
                "arquetipo": ARQUETIPOS[o["arquetipo"]],
                "faceta": o.get("faceta", ""),
                "peso": o.get("peso", 1.0),
            }
            for o in dados["opcoes"]
        ],
    }


class Command(BaseCommand):
    help = "Carrega/actualiza o banco v2 do CAT e desactiva o banco provisório, sem apagar perguntas."

    @transaction.atomic
    def handle(self, *args, **options):
        banco = json.loads(FICHEIRO_BANCO.read_text(encoding="utf-8"))

        criados, actualizados = 0, 0
        for dados in banco:
            _, criado = ItemCAT.objects.update_or_create(
                codigo=dados["codigo"], defaults=converter_item(dados)
            )
            criados += criado
            actualizados += not criado

        desactivados = ItemCAT.objects.filter(
            codigo__isnull=True, texto__in=BANCO_PROVISORIO, ativo=True
        ).update(ativo=False)

        self.stdout.write(self.style.SUCCESS(
            f"Banco CAT v2: {criados} criados, {actualizados} actualizados, "
            f"{desactivados} do banco provisório desactivados. "
            f"Itens activos: {ItemCAT.objects.filter(ativo=True).count()}."
        ))
