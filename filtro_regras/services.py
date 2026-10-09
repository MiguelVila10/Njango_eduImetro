from cursos.models import Curso


def filtrar_cursos(aluno):
    """
    Aplica o filtro de regras SE-ENTÃO sobre a base de cursos (RF07).
    Um curso é eliminado se falhar QUALQUER UM dos seus pré-requisitos.

    Cada eliminação traz o "motivo" em texto e as "faltas" estruturadas
    (disciplina, nota, nota_min, falta), usadas para mostrar ao aluno os
    cursos mais próximos quando nenhum é compatível.
    """
    notas_por_disciplina = {nota.disciplina: nota.nota for nota in aluno.notas.all()}

    cursos_aprovados = []
    eliminacoes = []

    for curso in Curso.objects.prefetch_related("prerequisitos"):
        faltas = []

        for prereq in curso.prerequisitos.all():
            nota_aluno = notas_por_disciplina.get(prereq.disciplina)

            if nota_aluno is None:
                raise ValueError(
                    f"Boletim incompleto: falta a nota de '{prereq.disciplina}' "
                    f"para avaliar o curso '{curso.nome}'."
                )

            if nota_aluno < prereq.nota_min:
                faltas.append({
                    "disciplina": prereq.disciplina,
                    "nota": nota_aluno,
                    "nota_min": prereq.nota_min,
                    "falta": prereq.nota_min - nota_aluno,
                })

        if faltas:
            motivo = " ".join(
                f"Nota em {f['disciplina']} ({f['nota']}) abaixo do mínimo exigido ({f['nota_min']})."
                for f in faltas
            )
            eliminacoes.append({"curso": curso, "motivo": motivo, "faltas": faltas})
        else:
            cursos_aprovados.append(curso)

    return cursos_aprovados, eliminacoes
