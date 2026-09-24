from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


class Curso(models.Model):
    """
    Representa um curso técnico do dataset real (Cap. V, Tabela 6 — adaptada).
    """

    ARQUETIPOS = [
        ("Analítico", "Analítico"),
        ("Humanista", "Humanista"),
        ("Criativo", "Criativo"),
        ("Estrategista", "Estrategista"),
    ]

    nome = models.CharField(max_length=255, help_text="Nome do curso técnico.")
    instituicao = models.CharField(max_length=100, help_text="ITEL, IPIL, IMEL, IMS ou CEARTE.")
    arquetipo_dominante = models.CharField(
        max_length=20, choices=ARQUETIPOS,
        help_text="Analítico, Humanista, Criativo ou Estrategista."
    )

    class Meta:
        verbose_name = "Curso"
        verbose_name_plural = "Cursos"
        ordering = ["nome"]

    def __str__(self):
        return f"{self.nome} ({self.instituicao})"


class PreRequisitoCurso(models.Model):
    """
    Representa um pré-requisito rígido de um curso (RF07 — filtro SE-ENTÃO).

    Um curso pode ter múltiplos pré-requisitos (ex. ITEL/Electrónica
    exige Matemática ≥14, Física ≥14 e Química ≥14 simultaneamente) —
    entidade acrescentada ao modelo original do Cap. V para reflectir
    correctamente o dataset real de cursos.
    """

    curso = models.ForeignKey(
        Curso, on_delete=models.CASCADE, related_name="prerequisitos",
        help_text="Curso a que este pré-requisito pertence."
    )
    disciplina = models.CharField(max_length=100, help_text="Disciplina de pré-requisito.")
    nota_min = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(10), MaxValueValidator(20)],
        help_text="Nota mínima exigida (10-20)."
    )

    class Meta:
        verbose_name = "Pré-requisito de Curso"
        verbose_name_plural = "Pré-requisitos de Curso"
        unique_together = ["curso", "disciplina"]

    def __str__(self):
        return f"{self.curso.nome}: {self.disciplina} ≥ {self.nota_min}"


class VetorIdealCurso(models.Model):
    """
    Representa o valor ideal de uma disciplina para um curso (RF08).
    Suporta vetor de 12 dimensões (todas as disciplinas), com destaque
    implícito nas disciplinas-chave via peso mais alto.
    """

    curso = models.ForeignKey(
        Curso, on_delete=models.CASCADE, related_name="vetores_ideais",
        help_text="Curso a que este vetor pertence."
    )
    disciplina = models.CharField(max_length=100, help_text="Disciplina.")
    peso_ideal = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(10), MaxValueValidator(20)],
        help_text="Valor de referência validado por peritos (10-20)."
    )

    class Meta:
        verbose_name = "Vetor Ideal do Curso"
        verbose_name_plural = "Vetores Ideais do Curso"
        unique_together = ["curso", "disciplina"]

    def __str__(self):
        return f"{self.curso.nome} — {self.disciplina}: {self.peso_ideal}"