# alunos/estado.py
"""
Estado de cada aluno na vista do orientador.

- por_terminar: ainda não terminou (sem notas completas, sem respostas
  ao teste, ou ainda sem sugestões geradas);
- sem_curso_compativel: já tem as notas e respondeu ao teste, mas as
  notas não chegam ao mínimo de nenhum curso. São os alunos que mais
  precisam do orientador, por isso têm estado próprio;
- ponto_de_atencao: tem sugestões, mas com alerta de viés ou confiança
  baixa nas respostas;
- concluido: tem sugestões sem alertas.

As funções trabalham sobre dados já carregados (prefetch de
"recomendacoes", "respostas_cat" e "notas"), para a lista não fazer
consultas por aluno.
"""

from cursos.models import Curso
from filtro_regras.services import BoletimIncompleto, avaliar_cursos

POR_TERMINAR = "por_terminar"
SEM_CURSO_COMPATIVEL = "sem_curso_compativel"
PONTO_DE_ATENCAO = "ponto_de_atencao"
CONCLUIDO = "concluido"


def carregar_cursos():
    """Catálogo com pré-requisitos, carregado uma vez por pedido."""
    return list(Curso.objects.prefetch_related("prerequisitos"))


def tem_alertas(alertas):
    return any(alertas.get(k) for k in ("sobrestimacao", "subestimacao")) if alertas else False


def compatibilidade(aluno, cursos):
    """
    (aprovados, eliminacoes) segundo as notas do aluno, ou None se o
    aluno ainda não respondeu ao teste ou o boletim está incompleto.
    """
    if not any(r.tentativa == aluno.tentativa_cat for r in aluno.respostas_cat.all()):
        return None
    notas = {n.disciplina: n.nota for n in aluno.notas.all()}
    try:
        return avaliar_cursos(notas, cursos)
    except BoletimIncompleto:
        return None


def estado_do_aluno(aluno, cursos):
    recs = sorted(aluno.recomendacoes.all(), key=lambda r: r.rank)
    if recs:
        primeira = recs[0]
        baixa = (primeira.confianca_cat or {}).get("nivel") == "baixa"
        if baixa or tem_alertas(primeira.alertas_vieses):
            return PONTO_DE_ATENCAO
        return CONCLUIDO
    resultado = compatibilidade(aluno, cursos)
    if resultado is not None and not resultado[0]:
        return SEM_CURSO_COMPATIVEL
    return POR_TERMINAR
