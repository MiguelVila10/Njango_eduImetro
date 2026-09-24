from django.core.exceptions import ValidationError
from django.db import models

from alunos.models import Aluno


class ItemCAT(models.Model):
    """
    Representa uma questão do banco adaptativo do CAT (RF04, RF05).
    """

    TIPOS = [
        ("nucleo", "Núcleo"),
        ("verificacao", "Verificação de Coerência"),
    ]

    texto = models.TextField(help_text="Enunciado da questão.")
    tipo = models.CharField(
        max_length=20, choices=TIPOS, default="nucleo",
        help_text="Núcleo ou verificação de coerência (RF05)."
    )
    opcoes = models.JSONField(
        help_text='Lista de 4 opções. Ex: [{"texto": "...", "arquetipo": "Analítico"}, ...]'
    )

    class Meta:
        verbose_name = "Item CAT"
        verbose_name_plural = "Itens CAT"

    def __str__(self):
        return self.texto[:50]

    def clean(self):
        if not isinstance(self.opcoes, list) or len(self.opcoes) != 4:
            raise ValidationError("Um ItemCAT deve ter exactamente 4 opções.")
        arquetipos_validos = {"Analítico", "Humanista", "Criativo", "Estrategista"}
        if {o.get("arquetipo") for o in self.opcoes} != arquetipos_validos:
            raise ValidationError("As 4 opções devem cobrir exactamente os 4 arquétipos.")


class RespostaCAT(models.Model):
    """
    Representa a resposta de um aluno a um item do CAT (RF04, RF06).
    """

    aluno = models.ForeignKey(
        Aluno, on_delete=models.CASCADE, related_name="respostas_cat",
        help_text="Aluno que respondeu."
    )
    item = models.ForeignKey(
        ItemCAT, on_delete=models.CASCADE, related_name="respostas",
        help_text="Item CAT respondido."
    )
    arquetipo_escolhido = models.CharField(
        max_length=20,
        choices=[
            ("Analítico", "Analítico"), ("Humanista", "Humanista"),
            ("Criativo", "Criativo"), ("Estrategista", "Estrategista"),
        ],
        help_text="Arquétipo associado à opção escolhida pelo aluno."
    )

    class Meta:
        verbose_name = "Resposta CAT"
        verbose_name_plural = "Respostas CAT"
        unique_together = ["aluno", "item"]

    def __str__(self):
        return f"{self.aluno.nome} → item {self.item_id}: {self.arquetipo_escolhido}"