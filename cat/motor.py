# cat/motor.py
"""
Motor do CAT adaptativo (RF04, RF05) — lógica pura, sem acesso à base de dados.

Abordagem: CAT bayesiano com calibração sintética definida por especialista.

1. Calibração: para cada pergunta, a probabilidade de um aluno de arquétipo K
   escolher a opção do arquétipo O depende apenas da TENDÊNCIA da pergunta
   (o arquétipo para o qual a situação puxa naturalmente):
       peso(O, K) = PESO_PROPRIO se O == K, senão PESO_OUTRO
       peso(O, K) *= FATOR_TENDENCIA se O == tendência da pergunta
       P(O | K) = peso(O, K) / soma dos pesos das 4 opções para K
2. Crença: começa em 25% para cada arquétipo e é actualizada a cada resposta
   pela regra de Bayes.
3. Selecção: a próxima pergunta é a que minimiza a entropia esperada da crença
   (critério de máxima informação, usual em CAT).
4. Paragem: quando um arquétipo atinge CERTEZA_ALVO (respeitando o mínimo de
   perguntas), quando se atinge o máximo, ou quando o banco se esgota.

Limitação assumida (protótipo): os pesos são definidos por julgamento de
especialista e não estimados a partir de dados reais de aplicação (IRT).
"""

import math
import random

ARQUETIPOS = ["Analítico", "Humanista", "Criativo", "Estrategista"]

# Calibração sintética (julgamento de especialista)
PESO_PROPRIO = 6.0      # opção do próprio arquétipo do aluno
PESO_OUTRO = 1.0        # opção de outro arquétipo
FATOR_TENDENCIA = 3.0   # a opção "socialmente esperada" na situação da pergunta

# Regras de paragem
CERTEZA_ALVO = 0.90
MIN_PERGUNTAS = 5
MAX_PERGUNTAS = 15

MOTIVO_PERFIL = "perfil_identificado"
MOTIVO_MAXIMO = "maximo_atingido"
MOTIVO_BANCO = "banco_esgotado"


def _normalizar_tendencia(tendencia):
    """Qualquer valor que não seja um dos 4 arquétipos é tratado como neutro."""
    return tendencia if tendencia in ARQUETIPOS else None


def matriz_probabilidades(tendencia):
    """
    Devolve {arquetipo_da_opcao: {arquetipo_do_aluno: P(escolher essa opção)}}.
    Para cada arquétipo do aluno, as probabilidades das 4 opções somam 1.
    """
    tendencia = _normalizar_tendencia(tendencia)
    matriz = {opcao: {} for opcao in ARQUETIPOS}
    for aluno in ARQUETIPOS:
        pesos = {}
        for opcao in ARQUETIPOS:
            peso = PESO_PROPRIO if opcao == aluno else PESO_OUTRO
            if opcao == tendencia:
                peso *= FATOR_TENDENCIA
            pesos[opcao] = peso
        total = sum(pesos.values())
        for opcao in ARQUETIPOS:
            matriz[opcao][aluno] = pesos[opcao] / total
    return matriz


def crenca_inicial():
    return {a: 1.0 / len(ARQUETIPOS) for a in ARQUETIPOS}


def atualizar_crenca(crenca, tendencia, arquetipo_escolhido):
    """Regra de Bayes: crença_nova(K) ∝ crença(K) × P(opção escolhida | K)."""
    if arquetipo_escolhido not in ARQUETIPOS:
        raise ValueError(f"Arquétipo desconhecido: {arquetipo_escolhido}")
    linha = matriz_probabilidades(tendencia)[arquetipo_escolhido]
    nao_normalizada = {k: crenca[k] * linha[k] for k in ARQUETIPOS}
    total = sum(nao_normalizada.values())
    return {k: v / total for k, v in nao_normalizada.items()}


def calcular_crenca(respostas):
    """respostas: iterável de pares (tendencia_da_pergunta, arquetipo_escolhido)."""
    crenca = crenca_inicial()
    for tendencia, escolhido in respostas:
        crenca = atualizar_crenca(crenca, tendencia, escolhido)
    return crenca


def entropia(crenca):
    return -sum(p * math.log(p) for p in crenca.values() if p > 0)


def entropia_esperada(crenca, tendencia):
    """Incerteza média que restaria depois de o aluno responder a uma pergunta desta tendência."""
    matriz = matriz_probabilidades(tendencia)
    esperada = 0.0
    for opcao in ARQUETIPOS:
        p_opcao = sum(crenca[k] * matriz[opcao][k] for k in ARQUETIPOS)
        if p_opcao > 0:
            esperada += p_opcao * entropia(atualizar_crenca(crenca, tendencia, opcao))
    return esperada


def arquetipo_provavel(crenca):
    return max(ARQUETIPOS, key=lambda a: crenca[a])


def decidir_paragem(crenca, n_respondidas, n_disponiveis):
    """Devolve o motivo de paragem, ou None se o CAT deve continuar."""
    if n_respondidas >= MIN_PERGUNTAS and max(crenca.values()) >= CERTEZA_ALVO:
        return MOTIVO_PERFIL
    if n_respondidas >= MAX_PERGUNTAS:
        return MOTIVO_MAXIMO
    if n_disponiveis == 0:
        return MOTIVO_BANCO
    return None


def escolher_item(crenca, candidatos, rng=None):
    """
    candidatos: lista de pares (item_id, tendencia) ainda não respondidos.
    Escolhe a pergunta mais informativa. Entre perguntas igualmente
    informativas (mesma tendência), sorteia uma, para que alunos diferentes
    não recebam sempre a mesma sequência.
    """
    if not candidatos:
        return None
    rng = rng or random.Random()
    cache = {}
    melhores, melhor_valor = [], None
    for item_id, tendencia in candidatos:
        chave = _normalizar_tendencia(tendencia)
        if chave not in cache:
            cache[chave] = entropia_esperada(crenca, chave)
        valor = cache[chave]
        if melhor_valor is None or valor < melhor_valor - 1e-12:
            melhores, melhor_valor = [item_id], valor
        elif abs(valor - melhor_valor) <= 1e-12:
            melhores.append(item_id)
    return rng.choice(sorted(melhores))
