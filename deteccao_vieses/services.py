# deteccao_vieses/services.py

LIMIAR_VIES = 0.15  # 15 pontos percentuais (Cap. II, Secção 2.6.2-2.6.3)


def detectar_vieses(aluno):
    """
    Detecta Efeito Dunning-Kruger (sobrestimação) e Síndrome do Impostor
    (subestimação) comparando o Vetor Psicométrico (VPM) com o Vetor
    Psicográfico (VPC), por arquétipo (RF09, Cap. II Secção 2.6.1-2.6.3).

    Retorna: dict {"sobrestimacao": [...arquétipos], "subestimacao": [...arquétipos]}
    """
    from alunos.models import NotaDisciplina

    mapeamento = {
        "Analítico": ["Matemática", "Física", "Química"],
        "Humanista": ["Biologia", "Português", "Educação Moral e Cívica"],
        "Criativo": ["Educação Visual", "Educação Laboral", "Língua Estrangeira"],
        "Estrategista": ["História", "Geografia", "Educação Física"],
    }

    notas_por_disciplina = {n.disciplina: n.nota for n in aluno.notas.all()}

    vpm = {}
    for arquetipo, disciplinas in mapeamento.items():
        notas = [notas_por_disciplina.get(d) for d in disciplinas]
        if None in notas:
            raise ValueError(f"Boletim incompleto: falta nota para calcular VPM({arquetipo}).")
        vpm[arquetipo] = sum(notas) / len(notas)

    respostas = aluno.respostas_cat.all()
    total_respostas = respostas.count()
    if total_respostas == 0:
        raise ValueError("O aluno ainda não respondeu a nenhuma questão do CAT.")

    from collections import Counter
    contagem = Counter(r.arquetipo_escolhido for r in respostas)
    vpc = {a: contagem.get(a, 0) / total_respostas for a in mapeamento}

    soma_vpm = sum(vpm.values())
    proporcao_vpm = {a: vpm[a] / soma_vpm for a in mapeamento}

    sobrestimacao = []
    subestimacao = []

    for arquetipo in mapeamento:
        diferenca = vpc[arquetipo] - proporcao_vpm[arquetipo]
        if diferenca > LIMIAR_VIES:
            sobrestimacao.append(arquetipo)
        elif -diferenca > LIMIAR_VIES:
            subestimacao.append(arquetipo)

    return {"sobrestimacao": sobrestimacao, "subestimacao": subestimacao}