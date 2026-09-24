# similaridade/services.py

import math

from cursos.models import VetorIdealCurso


def calcular_similaridade(aluno, curso):
    """
    Calcula a Similaridade de Cosseno entre o vetor de notas do aluno e o
    vetor ideal do curso, restrito às disciplinas-chave desse curso (RF08).

    Fórmula: cos(θ) = (A · B) / (|A| |B|), conforme Cap. II, Secção 2.7.3.

    Retorna: float entre -1 e 1 (na prática, entre 0 e 1, já que notas e
    pesos ideais são sempre positivos, 10-20).
    """
    vetores_ideais = VetorIdealCurso.objects.filter(curso=curso)

    if not vetores_ideais.exists():
        raise ValueError(f"O curso '{curso.nome}' não tem vetor ideal definido.")

    notas_por_disciplina = {
        nota.disciplina: nota.nota
        for nota in aluno.notas.all()
    }

    vetor_aluno = []
    vetor_curso = []

    for vetor_ideal in vetores_ideais:
        nota_aluno = notas_por_disciplina.get(vetor_ideal.disciplina)

        if nota_aluno is None:
            raise ValueError(
                f"Boletim incompleto: falta a nota de '{vetor_ideal.disciplina}' "
                f"para calcular a similaridade com '{curso.nome}'."
            )

        vetor_aluno.append(nota_aluno)
        vetor_curso.append(vetor_ideal.peso_ideal)

    produto_escalar = sum(a * b for a, b in zip(vetor_aluno, vetor_curso))
    magnitude_aluno = math.sqrt(sum(a ** 2 for a in vetor_aluno))
    magnitude_curso = math.sqrt(sum(b ** 2 for b in vetor_curso))

    if magnitude_aluno == 0 or magnitude_curso == 0:
        return 0.0

    return produto_escalar / (magnitude_aluno * magnitude_curso)