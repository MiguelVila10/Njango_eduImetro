from cursos.models import Curso


def filtrar_cursos(aluno):
    """
    Aplica o filtro de regras SE-ENTÃO sobre a base de cursos (RF07).
    Um curso é eliminado se falhar QUALQUER UM dos seus pré-requisitos.
    """
    notas_por_disciplina = {nota.disciplina: nota.nota for nota in aluno.notas.all()}

    cursos_aprovados = []
    eliminacoes = []

    for curso in Curso.objects.all():
        motivos_eliminacao = []

        for prereq in curso.prerequisitos.all():
            nota_aluno = notas_por_disciplina.get(prereq.disciplina)

            if nota_aluno is None:
                raise ValueError(
                    f"Boletim incompleto: falta a nota de '{prereq.disciplina}' "
                    f"para avaliar o curso '{curso.nome}'."
                )

            if nota_aluno < prereq.nota_min:
                motivos_eliminacao.append(
                    f"Nota em {prereq.disciplina} ({nota_aluno}) abaixo do mínimo exigido ({prereq.nota_min})."
                )

        if motivos_eliminacao:
            eliminacoes.append({"curso": curso, "motivo": " ".join(motivos_eliminacao)})
        else:
            cursos_aprovados.append(curso)

    return cursos_aprovados, eliminacoes