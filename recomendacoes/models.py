from django.db import models

# Create your models here.
# recomendacoes/models.py

from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models

from alunos.models import Aluno
from cursos.models import Curso


class Recomendacao(models.Model):
    """
    Representa uma das três recomendações de curso geradas para um aluno
    numa sessão (RF10, RF13).
    """

    aluno = models.ForeignKey(
        Aluno, on_delete=models.CASCADE, related_name="recomendacoes",
        help_text="Aluno a quem esta recomendação pertence."
    )
    curso = models.ForeignKey(
        Curso, on_delete=models.CASCADE, related_name="recomendacoes",
        help_text="Curso recomendado."
    )
    score_academico = models.FloatField(
        help_text="Similaridade de Cosseno calculada (RF08)."
    )
    score_psicografico = models.FloatField(
        help_text="Afinidade com o arquétipo dominante."
    )
    score_final = models.FloatField(
        help_text="Combinação ponderada dos dois scores."
    )
    rank = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(3)],
        help_text="Posição no ranking final (1 a 3)."
    )
    escolhida_pelo_aluno = models.BooleanField(
        default=False,
        help_text="Indica se esta foi a recomendação seleccionada pelo aluno (RF13)."
    )

    class Meta:
        verbose_name = "Recomendação"
        verbose_name_plural = "Recomendações"
        unique_together = ["aluno", "rank"]
        ordering = ["aluno", "rank"]

    def __str__(self):
        return f"{self.aluno.nome} → {self.curso.nome} (rank {self.rank})"