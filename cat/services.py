# cat/services.py
"""
Camada de serviço do CAT adaptativo: liga o motor puro (cat/motor.py)
à base de dados (ItemCAT, RespostaCAT).
"""

from . import motor
from .models import ItemCAT


def estado_cat(aluno, rng=None):
    """
    Calcula o estado actual do CAT para um aluno e, se o teste ainda não
    terminou, escolhe a próxima pergunta.

    Retorna um dict:
        terminado (bool), motivo (str|None), respondidas (int),
        crenca ({arquetipo: prob}), arquetipo_provavel (str),
        item (ItemCAT|None)
    """
    respostas = list(aluno.respostas_cat.select_related("item"))
    crenca = motor.calcular_crenca(
        (r.item.tendencia, r.arquetipo_escolhido) for r in respostas
    )

    respondidos = {r.item_id for r in respostas}
    candidatos = list(
        ItemCAT.objects.exclude(id__in=respondidos).values_list("id", "tendencia")
    )

    motivo = motor.decidir_paragem(crenca, len(respondidos), len(candidatos))

    item = None
    if motivo is None:
        item_id = motor.escolher_item(crenca, candidatos, rng=rng)
        item = ItemCAT.objects.get(pk=item_id)

    return {
        "terminado": motivo is not None,
        "motivo": motivo,
        "respondidas": len(respondidos),
        "crenca": {a: round(p, 4) for a, p in crenca.items()},
        "arquetipo_provavel": motor.arquetipo_provavel(crenca),
        "item": item,
    }
