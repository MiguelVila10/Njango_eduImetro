# cat/services.py
"""
Camada de serviço do CAT adaptativo: liga o motor puro (cat/motor.py)
à base de dados (ItemCAT, RespostaCAT).

Pares de coerência (banco v2): o 1.º membro de cada par é um item "nucleo"
que o CAT pode escolher adaptativamente; o 2.º membro é um item
"verificacao" que nunca é escolhido pelo critério de informação — só é
apresentado para fechar um par já aberto, antes de o teste terminar.

Qualidade das respostas (banco v2, secção 7): três indicadores —
coerência dos pares, respostas demasiado rápidas e escolha mecânica da
mesma posição no ecrã. Com 2 ou mais indicadores falhados, a confiança é
"baixa": o aluno pode repetir o CAT uma vez e o orientador vê o rótulo.
Os limiares são provisórios e devem ser afinados no piloto.
"""

import math

from django.conf import settings

from . import motor
from .models import ItemCAT, respostas_atuais

COERENTE = "coerente"
INCOERENTE = "incoerente"
INDETERMINADA = "indeterminada"
MIN_PARES_PARA_AVALIAR = 2

CONFIANCA_NORMAL = "normal"
CONFIANCA_BAIXA = "baixa"
MIN_INDICADORES_FALHADOS = 2
MIN_RESPOSTAS_CRONOMETRADAS = 5
PROPORCAO_RAPIDAS = 0.5
SEQUENCIA_MESMA_POSICAO = 8
MAX_TENTATIVAS = 2


def _limiar_tempo_ms():
    return getattr(settings, "CAT_LIMIAR_TEMPO_RAPIDO_MS", 3000)


def avaliar_coerencia(respostas):
    """
    Compara as respostas aos dois membros de cada par de coerência.
    Coerente se coincidirem pelo menos 2/3 dos pares avaliados (com 3 pares:
    2 de 3). Com menos de 2 pares avaliados, o resultado fica indeterminado.
    """
    por_par = {}
    for r in respostas:
        if r.item.par_coerencia:
            por_par.setdefault(r.item.par_coerencia, []).append(r.arquetipo_escolhido)

    avaliados = [escolhas for escolhas in por_par.values() if len(escolhas) == 2]
    coincidentes = sum(1 for a, b in avaliados if a == b)

    if len(avaliados) < MIN_PARES_PARA_AVALIAR:
        resultado = INDETERMINADA
    elif coincidentes >= math.ceil(2 * len(avaliados) / 3):
        resultado = COERENTE
    else:
        resultado = INCOERENTE

    return {
        "pares_avaliados": len(avaliados),
        "pares_coincidentes": coincidentes,
        "resultado": resultado,
    }


def _maior_sequencia(valores):
    maior, atual, anterior = 0, 0, None
    for v in valores:
        if v and v == anterior:
            atual += 1
        else:
            atual = 1 if v else 0
        anterior = v
        maior = max(maior, atual)
    return maior


def avaliar_confianca(respostas, coerencia):
    """Devolve {"nivel": "normal"|"baixa", "motivos": [...], "indicadores": {...}}."""
    motivos = []

    falhou_coerencia = coerencia["resultado"] == INCOERENTE
    if falhou_coerencia:
        motivos.append("Respostas diferentes em situações paralelas (pares de coerência).")

    cronometradas = [r.tempo_resposta_ms for r in respostas if r.tempo_resposta_ms is not None]
    rapidas = sum(1 for t in cronometradas if t < _limiar_tempo_ms())
    falhou_tempo = (
        len(cronometradas) >= MIN_RESPOSTAS_CRONOMETRADAS
        and rapidas / len(cronometradas) >= PROPORCAO_RAPIDAS
    )
    if falhou_tempo:
        motivos.append("Muitas respostas dadas depressa demais para ler a situação.")

    sequencia = _maior_sequencia([r.posicao_ecra for r in respostas])
    falhou_posicao = sequencia >= SEQUENCIA_MESMA_POSICAO
    if falhou_posicao:
        motivos.append(f"{sequencia} escolhas seguidas na mesma posição do ecrã.")

    falhas = sum([falhou_coerencia, falhou_tempo, falhou_posicao])
    return {
        "nivel": CONFIANCA_BAIXA if falhas >= MIN_INDICADORES_FALHADOS else CONFIANCA_NORMAL,
        "motivos": motivos,
        "indicadores": {
            "coerencia": coerencia["resultado"],
            "respostas_rapidas": rapidas,
            "respostas_cronometradas": len(cronometradas),
            "maior_sequencia_mesma_posicao": sequencia,
        },
    }


def estado_cat(aluno, rng=None):
    """
    Calcula o estado actual do CAT para um aluno (tentativa actual) e, se o
    teste ainda não terminou, escolhe a próxima pergunta.

    Retorna um dict:
        terminado, motivo, tentativa, respondidas, crenca, arquetipo_provavel,
        coerencia, confianca, pode_repetir, item (ItemCAT|None)
    """
    respostas = list(respostas_atuais(aluno).select_related("item"))
    crenca = motor.calcular_crenca(
        (r.item.tendencia, r.arquetipo_escolhido) for r in respostas
    )
    respondidos = {r.item_id for r in respostas}

    ativos = list(
        ItemCAT.objects.filter(ativo=True).exclude(id__in=respondidos)
        .values("id", "tendencia", "tipo", "par_coerencia", "posicao")
    )

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

    terminado = motivo is not None
    coerencia = avaliar_coerencia(respostas)
    confianca = avaliar_confianca(respostas, coerencia)

    return {
        "terminado": terminado,
        "motivo": motivo,
        "tentativa": aluno.tentativa_cat,
        "respondidas": len(respondidos),
        "crenca": {a: round(p, 4) for a, p in crenca.items()},
        "arquetipo_provavel": motor.arquetipo_provavel(crenca),
        "coerencia": coerencia,
        "confianca": confianca,
        "pode_repetir": (
            terminado
            and confianca["nivel"] == CONFIANCA_BAIXA
            and aluno.tentativa_cat < MAX_TENTATIVAS
        ),
        "item": ItemCAT.objects.get(pk=item_id) if item_id else None,
    }


def repetir_cat(aluno):
    """
    Inicia a 2.ª (e última) tentativa do CAT. As respostas da 1.ª ficam
    guardadas para análise; as recomendações antigas são apagadas porque
    serão geradas de novo no fim.
    """
    estado = estado_cat(aluno)
    if not estado["pode_repetir"]:
        raise ValueError(
            "Só é possível repetir o teste uma vez, depois de terminar, "
            "e quando as respostas indicam pouca atenção."
        )
    aluno.tentativa_cat += 1
    aluno.save(update_fields=["tentativa_cat"])
    aluno.recomendacoes.all().delete()
    return estado_cat(aluno)
