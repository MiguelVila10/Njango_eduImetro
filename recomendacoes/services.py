# recomendacoes/services.py

from collections import Counter

from cat.models import respostas_atuais
from filtro_regras.services import filtrar_cursos
from similaridade.services import calcular_similaridade
from deteccao_vieses.services import detectar_vieses
from .models import Recomendacao

MAX_CURSOS_PROXIMOS = 3


class SemCursosCompativeis(ValueError):
    """
    Nenhum curso cumpre os pré-requisitos. Leva consigo os cursos mais
    próximos (os que pedem menos pontos para lá chegar), para o aluno ver
    o que lhe falta em vez de uma mensagem vazia.
    """

    def __init__(self, cursos_proximos):
        super().__init__("Nenhum curso cumpre os pré-requisitos deste aluno.")
        self.cursos_proximos = cursos_proximos


def cursos_mais_proximos(eliminacoes, arquetipo_aluno=None, limite=MAX_CURSOS_PROXIMOS):
    """
    Ordena os cursos eliminados pelo total de pontos em falta (menos é
    melhor). Em caso de empate, vem primeiro o curso do perfil do aluno.
    """
    def chave(e):
        total = sum(f["falta"] for f in e["faltas"])
        outro_perfil = e["curso"].arquetipo_dominante != arquetipo_aluno
        return (total, outro_perfil, e["curso"].nome)

    proximos = []
    for e in sorted(eliminacoes, key=chave)[:limite]:
        curso = e["curso"]
        proximos.append({
            "curso": curso.pk,
            "curso_nome": curso.nome,
            "curso_instituicao": curso.instituicao,
            "curso_arquetipo": curso.arquetipo_dominante,
            "faltas": e["faltas"],
            "pontos_em_falta": sum(f["falta"] for f in e["faltas"]),
        })
    return proximos


def gerar_recomendacoes(aluno, confianca=None):
    """
    Orquestra o motor de inferência completo (RF07, RF08, RF09, RF10) para
    um aluno: filtra cursos, calcula compatibilidade, detecta vieses
    cognitivos, e grava as 3 melhores recomendações com os alertas anexados.
    """
    cursos_aprovados, eliminacoes = filtrar_cursos(aluno)

    respostas = respostas_atuais(aluno)
    total_respostas = respostas.count()
    contagem_por_arquetipo = Counter(r.arquetipo_escolhido for r in respostas)

    if not cursos_aprovados:
        arquetipo = contagem_por_arquetipo.most_common(1)[0][0] if contagem_por_arquetipo else None
        raise SemCursosCompativeis(cursos_mais_proximos(eliminacoes, arquetipo))

    if total_respostas == 0:
        raise ValueError("O aluno ainda não respondeu a nenhuma questão do CAT.")

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
            alertas_vieses=alertas_vieses,
            confianca_cat=confianca or {},
        )
        recomendacoes_criadas.append(rec)

    return recomendacoes_criadas