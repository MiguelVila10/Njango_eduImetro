# alunos/models.py — versão final com NotaDisciplina

from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.utils import timezone


class Aluno(models.Model):
    """
    Representa o perfil básico do aluno registado no sistema (RF01).
    """

    nome = models.CharField(max_length=255, help_text="Nome do aluno.")
    idade = models.PositiveSmallIntegerField(help_text="Idade do aluno.")
    escola = models.CharField(max_length=255, help_text="Instituição de origem do aluno.")
    criado_em = models.DateTimeField(
        default=timezone.now, editable=False,
        help_text="Data e hora em que o aluno iniciou o teste."
    )
    tentativa_cat = models.PositiveSmallIntegerField(
        default=1, editable=False,
        help_text="Tentativa actual do CAT (1 ou 2). A 2.ª só existe se a "
                  "1.ª tiver confiança baixa e o aluno aceitar repetir."
    )

    class Meta:
        verbose_name = "Aluno"
        verbose_name_plural = "Alunos"
        ordering = ["nome"]

    def __str__(self):
        return f"{self.nome} ({self.escola})"


class NotaDisciplina(models.Model):
    """
    Representa a nota de um aluno numa das 12 disciplinas do I Ciclo
    (RF02, RF03). Um aluno tem exactamente uma nota por disciplina
    (Cap. V, Secção 5.4.2).

    Alimenta o filtro SE-ENTÃO (RF07), que compara estas notas com
    Curso.prereq_nota_min.
    """

    aluno = models.ForeignKey(
        Aluno,
        on_delete=models.CASCADE,
        related_name="notas",
        help_text="Aluno a quem esta nota pertence."
    )
    disciplina = models.CharField(
        max_length=100,
        help_text="Uma das 12 disciplinas do I Ciclo."
    )
    nota = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(10), MaxValueValidator(20)],
        help_text="Nota do aluno na disciplina (10-20)."
    )

    class Meta:
        verbose_name = "Nota de Disciplina"
        verbose_name_plural = "Notas de Disciplina"
        ordering = ["aluno", "disciplina"]
        unique_together = ["aluno", "disciplina"]

    def __str__(self):
        return f"{self.aluno.nome} — {self.disciplina}: {self.nota}"