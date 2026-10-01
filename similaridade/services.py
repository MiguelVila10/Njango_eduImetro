# similaridade/services.py

import math

from cursos.models import VetorIdealCurso

# Valor devolvido quando um dos vetores não tem variação (ex.: aluno com as
# 12 notas iguais): sem pontos fortes nem fracos, não há afinidade a medir.
SIMILARIDADE_NEUTRA = 0.5


def _centrar(valores):
    """Subtrai a média do próprio vetor a cada valor."""
    media = sum(valores) / len(valores)
    return [v - media for v in valores]


def calcular_similaridade(aluno, curso):
    """
    Calcula a Similaridade de Cosseno AJUSTADA (centrada) entre o vetor de
    notas do aluno e o vetor ideal do curso, sobre as disciplinas do vetor
    ideal desse curso (RF08, Cap. II, Secção 2.7.3).

    Porquê a versão ajustada: as notas e os pesos ideais estão todos entre
    10 e 20, por isso o cosseno simples dá ~0,98–0,99 para QUALQUER par
    aluno/curso e não distingue cursos. Centrando cada vetor na sua própria
    média, compara-se o padrão de pontos fortes e fracos do aluno com o
    perfil do curso (cosseno ajustado / correlação de Pearson, usado em
    sistemas de recomendação — Sarwar et al., 2001).

    Fórmula:
        a' = a - média(a),  b' = b - média(b)
        r  = (a' · b') / (|a'| |b'|)          ∈ [-1, 1]
        similaridade = (r + 1) / 2             ∈ [0, 1]

    A conversão para [0, 1] mantém a compatibilidade com
    score_final = 0,6 × score_academico + 0,4 × score_psicografico.

    Retorna: float entre 0 e 1 (0,5 = neutro, quando um dos vetores não tem
    variação).
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

    aluno_centrado = _centrar(vetor_aluno)
    curso_centrado = _centrar(vetor_curso)

    produto_escalar = sum(a * b for a, b in zip(aluno_centrado, curso_centrado))
    magnitude_aluno = math.sqrt(sum(a ** 2 for a in aluno_centrado))
    magnitude_curso = math.sqrt(sum(b ** 2 for b in curso_centrado))

    if magnitude_aluno == 0 or magnitude_curso == 0:
        return SIMILARIDADE_NEUTRA

    r = produto_escalar / (magnitude_aluno * magnitude_curso)
    r = max(-1.0, min(1.0, r))  # protege contra erros de arredondamento
    return (r + 1) / 2
