# cat/services.py
"""
Camada de serviço do CAT adaptativo: liga o motor puro (cat/motor.py)
à base de dados (ItemCAT, RespostaCAT).

Pares de coerência (banco v2): o 1.º membro de cada par é um item "nucleo"
que o CAT pode escolher adaptativamente; o 2.º membro é um item
"verificacao" que nunca é escolhido pelo critério de informação — só é
apresentado para fechar um par já aberto, antes de o teste terminar. Assim a
verificação fica sempre afastada do 1.º membro, como pede o banco.
"""

import math

from . import motor
from .models import ItemCAT

CONFIANCA_NORMAL = "normal"
CONFIANCA_BAIXA = "baixa"
CONFIANCA_INDETERMINADA = "indeterminada"
MIN_PARES_PARA_AVALIAR = 2


def avaliar_coerencia(respostas):
    """
    Compara as respostas aos dois membros de cada par de coerência.
    Coerente se coincidirem pelo menos 2/3 dos pares avaliados (com 3 pares:
    2 de 3). Com menos de 2 pares avaliados, a confiança fica indeterminada.
    """
    por_par = {}
    for r in respostas:
        if r.item.par_coerencia:
            por_par.setdefault(r.item.par_coerencia, []).append(r.arquetipo_escolhido)

    avaliados = [escolhas for escolhas in por_par.values() if len(escolhas) == 2]
    coincidentes = sum(1 for a, b in avaliados if a == b)

    if len(avaliados) < MIN_PARES_PARA_AVALIAR:
        confianca = CONFIANCA_INDETERMINADA
    elif coincidentes >= math.ceil(2 * len(avaliados) / 3):
        confianca = CONFIANCA_NORMAL
    else:
        confianca = CONFIANCA_BAIXA

    return {
        "pares_avaliados": len(avaliados),
        "pares_coincidentes": coincidentes,
        "confianca": confianca,
    }


def estado_cat(aluno, rng=None):
    """
    Calcula o estado actual do CAT para um aluno e, se o teste ainda não
    terminou, escolhe a próxima pergunta.

    Retorna um dict:
        terminado (bool), motivo (str|None), respondidas (int),
        crenca ({arquetipo: prob}), arquetipo_provavel (str),
        coerencia (dict), item (ItemCAT|None)
    """
    respostas = list(aluno.respostas_cat.select_related("item"))
    crenca = motor.calcular_crenca(
        (r.item.tendencia, r.arquetipo_escolhido) for r in respostas
    )
    respondidos = {r.item_id for r in respostas}

    ativos = list(
        ItemCAT.objects.filter(ativo=True).exclude(id__in=respondidos)
        .values("id", "tendencia", "tipo", "par_coerencia", "posicao")
    )

    # Pares abertos: 1.º membro respondido, 2.º (verificação) ainda por responder.
    pares_respondidos = {r.item.par_coerencia for r in respostas if r.item.par_coerencia}
    verificacoes_pendentes = sorted(
        (i for i in ativos if i["tipo"] == "verificacao" and i["par_coerencia"] in pares_respondidos),
        key=lambda i: (i["posicao"] or 0, i["id"]),
    )

    candidatos = [(i["id"], i["tendencia"]) for i in ativos if i["tipo"] != "verificacao"]
    preferidos = {i["id"] for i in ativos if i["tipo"] != "verificacao" and i["par_coerencia"]}

    motivo = motor.decidir_paragem(crenca, len(respondidos), len(candidatos))

    item_id = None
    if motivo is None:
        item_id = motor.escolher_item(crenca, candidatos, rng=rng, preferidos=preferidos)
    elif verificacoes_pendentes:
        # Antes de terminar, fecha os pares de coerência que ficaram abertos.
        item_id = verificacoes_pendentes[0]["id"]
        motivo = None

    return {
        "terminado": motivo is not None,
        "motivo": motivo,
        "respondidas": len(respondidos),
        "crenca": {a: round(p, 4) for a, p in crenca.items()},
        "arquetipo_provavel": motor.arquetipo_provavel(crenca),
        "coerencia": avaliar_coerencia(respostas),
        "item": ItemCAT.objects.get(pk=item_id) if item_id else None,
    }
