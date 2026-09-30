# recomendacoes/services.py

from collections import Counter

from filtro_regras.services import filtrar_cursos
from similaridade.services import calcular_similaridade
from deteccao_vieses.services import detectar_vieses
from .models import Recomendacao


LIMITE_SOLICITACOES = 3


def gerar_recomendacoes(aluno):
    """
    Orquestra o motor de inferência completo (RF07, RF08, RF09, RF10) para
    um aluno: filtra cursos, calcula compatibilidade, detecta vieses
    cognitivos, e grava as 3 melhores recomendações com os alertas anexados.

    Limita a 3 o número de vezes que um aluno pode solicitar orientação
    (regra confirmada pelo utilizador).
    """
    if aluno.solicitacoes_orientacao >= LIMITE_SOLICITACOES:
        raise ValueError(
            f"Este aluno já atingiu o limite de {LIMITE_SOLICITACOES} pedidos de orientação."
        )

    cursos_aprovados, eliminacoes = filtrar_cursos(aluno)

    if not cursos_aprovados:
        raise ValueError("Nenhum curso cumpre os pré-requisitos deste aluno.")

    respostas = aluno.respostas_cat.all()
    total_respostas = respostas.count()

    if total_respostas == 0:
        raise ValueError("O aluno ainda não respondeu a nenhuma questão do CAT.")

    contagem_por_arquetipo = Counter(r.arquetipo_escolhido for r in respostas)
    alertas_vieses = detectar_vieses(aluno)

    resultados = []
    for curso in cursos_aprovados:
        score_academico = calcular_similaridade(aluno, curso)
        score_psicografico = contagem_por_arquetipo.get(curso.arquetipo_dominante, 0) / total_respostas
        score_final = 0.6 * score_academico + 0.4 * score_psicografico
        resultados.append((curso, score_academico, score_psicografico, score_final))

    resultados.sort(key=lambda r: r[3], reverse=True)
    top_3 = resultados[:3]

    Recomendacao.objects.filter(aluno=aluno).delete()

    recomendacoes_criadas = []
    for rank, (curso, score_academico, score_psicografico, score_final) in enumerate(top_3, start=1):
        rec = Recomendacao.objects.create(
            aluno=aluno, curso=curso,
            score_academico=score_academico,
            score_psicografico=score_psicografico,
            score_final=score_final,
            rank=rank,
            alertas_vieses=alertas_vieses
        )
        recomendacoes_criadas.append(rec)

    aluno.solicitacoes_orientacao += 1
    aluno.save()

    return recomendacoes_criadas