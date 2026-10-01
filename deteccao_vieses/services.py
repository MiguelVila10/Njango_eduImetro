# deteccao_vieses/services.py

from collections import Counter

# Diferença mínima entre a preferência do aluno por um arquétipo (VPC) e a
# preferência "neutra" (25%) para contar como preferência marcada.
LIMIAR_VIES = 0.15  # 15 pontos percentuais (Cap. II, Secção 2.6.2-2.6.3)

# Distância mínima (em valores, escala 10-20) entre a média do arquétipo e a
# média geral do PRÓPRIO aluno para o arquétipo contar como ponto forte/fraco.
MARGEM_ACADEMICA = 1.0

MAPEAMENTO = {
    "Analítico": ["Matemática", "Física", "Química"],
    "Humanista": ["Biologia", "Português", "Educação Moral e Cívica"],
    "Criativo": ["Educação Visual", "Educação Laboral", "Língua Estrangeira"],
    "Estrategista": ["História", "Geografia", "Educação Física"],
}


def detectar_vieses(aluno):
    """
    Detecta Efeito Dunning-Kruger (sobrestimação) e Síndrome do Impostor
    (subestimação) comparando, por arquétipo, o desempenho académico RELATIVO
    do aluno com a sua preferência declarada no CAT (RF09).

    1. Força académica (relativa ao próprio aluno):
           força(K) = média das notas de K − média geral do aluno
       Ponto forte: força ≥ +MARGEM_ACADEMICA · ponto fraco: força ≤ −MARGEM_ACADEMICA
    2. Preferência (VPC): proporção das respostas do CAT em cada arquétipo,
       comparada com a preferência neutra (25%).
    3. Alertas:
       - sobrestimação: o aluno prefere marcadamente K (VPC − 25% > LIMIAR_VIES)
         mas K é um ponto FRACO das suas notas;
       - subestimação: K é um ponto FORTE das suas notas mas o aluno quase não
         o escolhe (25% − VPC > LIMIAR_VIES).

    Porquê relativo: as notas estão todas entre 10 e 20, por isso a proporção
    simples (média de K ÷ soma das médias) fica sempre perto de 25% e disparava
    alertas em quase todos os alunos. Medir cada arquétipo em relação à média
    do próprio aluno só assinala contradições reais entre notas e preferências.

    Retorna: dict {"sobrestimacao": [...arquétipos], "subestimacao": [...arquétipos]}
    """
    notas_por_disciplina = {n.disciplina: n.nota for n in aluno.notas.all()}

    medias = {}
    for arquetipo, disciplinas in MAPEAMENTO.items():
        notas = [notas_por_disciplina.get(d) for d in disciplinas]
        if None in notas:
            raise ValueError(f"Boletim incompleto: falta nota para calcular VPM({arquetipo}).")
        medias[arquetipo] = sum(notas) / len(notas)

    respostas = aluno.respostas_cat.all()
    total_respostas = respostas.count()
    if total_respostas == 0:
        raise ValueError("O aluno ainda não respondeu a nenhuma questão do CAT.")

    contagem = Counter(r.arquetipo_escolhido for r in respostas)
    vpc = {a: contagem.get(a, 0) / total_respostas for a in MAPEAMENTO}

    media_geral = sum(medias.values()) / len(medias)
    preferencia_neutra = 1 / len(MAPEAMENTO)

    sobrestimacao = []
    subestimacao = []

    for arquetipo in MAPEAMENTO:
        forca = medias[arquetipo] - media_geral
        preferencia = vpc[arquetipo] - preferencia_neutra

        if preferencia > LIMIAR_VIES and forca <= -MARGEM_ACADEMICA:
            sobrestimacao.append(arquetipo)
        elif -preferencia > LIMIAR_VIES and forca >= MARGEM_ACADEMICA:
            subestimacao.append(arquetipo)

    return {"sobrestimacao": sobrestimacao, "subestimacao": subestimacao}
