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

    TENDENCIAS = [
        ("neutra", "Neutra"),
        ("Analítico", "Analítico"),
        ("Humanista", "Humanista"),
        ("Criativo", "Criativo"),
        ("Estrategista", "Estrategista"),
    ]

    CONTEXTOS = [
        ("Escola", "Escola"),
        ("Família", "Família"),
        ("Bairro", "Bairro"),
        ("Amigos", "Amigos"),
    ]

    codigo = models.CharField(
        max_length=20, unique=True, null=True, blank=True,
        help_text="Código do item no banco validado (ex.: AN-01). Opcional para itens novos."
    )
    texto = models.TextField(help_text="Enunciado da questão.")
    tipo = models.CharField(
        max_length=20, choices=TIPOS, default="nucleo",
        help_text="Núcleo ou verificação de coerência (RF05)."
    )
    tendencia = models.CharField(
        max_length=20, choices=TENDENCIAS, default="neutra",
        help_text="Arquétipo para o qual a situação da pergunta puxa naturalmente "
                  "(a opção desse arquétipo é a mais 'socialmente esperada'). "
                  "Usado na calibração do CAT adaptativo."
    )
    contexto = models.CharField(
        max_length=20, choices=CONTEXTOS, blank=True,
        help_text="Contexto da situação (escola, família, bairro, amigos)."
    )
    posicao = models.PositiveSmallIntegerField(
        null=True, blank=True,
        help_text="Ordem de referência na versão fixa do teste (1 a 20)."
    )
    par_coerencia = models.CharField(
        max_length=10, blank=True,
        help_text="Identificador do par de coerência (ex.: P1). Os dois membros do par "
                  "medem a mesma preferência em contextos diferentes."
    )
    ativo = models.BooleanField(
        default=True,
        help_text="Só os itens activos entram no CAT. Desactivar em vez de apagar "
                  "preserva as respostas antigas."
    )
    opcoes = models.JSONField(
        help_text='Lista de 4 opções, uma por arquétipo. Ex: [{"texto": "...", '
                  '"arquetipo": "Analítico", "faceta": "Física", "peso": 1.0}, ...]'
    )

    class Meta:
        verbose_name = "Item CAT"
        verbose_name_plural = "Itens CAT"
        ordering = ["posicao", "id"]

    def __str__(self):
        return self.texto[:50]

    def clean(self):
        erro = validar_opcoes(self.opcoes)
        if erro:
            raise ValidationError(erro)


ARQUETIPOS_VALIDOS = {"Analítico", "Humanista", "Criativo", "Estrategista"}


def validar_opcoes(opcoes):
    """Devolve a mensagem de erro, ou None se as opções forem válidas."""
    if not isinstance(opcoes, list) or len(opcoes) != 4:
        return "Um ItemCAT deve ter exactamente 4 opções."
    if not all(isinstance(o, dict) for o in opcoes):
        return "Cada opção deve ser um objecto com texto e arquétipo."
    if {o.get("arquetipo") for o in opcoes} != ARQUETIPOS_VALIDOS:
        return "As 4 opções devem cobrir exactamente os 4 arquétipos: Analítico, Humanista, Criativo, Estrategista."
    for o in opcoes:
        if not str(o.get("texto", "")).strip():
            return "Todas as opções precisam de texto."
        peso = o.get("peso", 1.0)
        if not isinstance(peso, (int, float)) or isinstance(peso, bool) or not 0 < peso <= 1:
            return "O peso de cada opção deve ser um número maior que 0 e no máximo 1."
    return None


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
    tentativa = models.PositiveSmallIntegerField(
        default=1,
        help_text="Tentativa do CAT a que esta resposta pertence. As respostas "
                  "de tentativas anteriores ficam guardadas para análise."
    )
    tempo_resposta_ms = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Tempo que o aluno levou a responder, em milissegundos (enviado pelo frontend)."
    )
    posicao_ecra = models.CharField(
        max_length=1, blank=True,
        choices=[("A", "A"), ("B", "B"), ("C", "C"), ("D", "D")],
        help_text="Posição da opção escolhida no ecrã (as opções são baralhadas)."
    )
    respondida_em = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        verbose_name = "Resposta CAT"
        verbose_name_plural = "Respostas CAT"
        unique_together = ["aluno", "item", "tentativa"]
        ordering = ["aluno", "tentativa", "respondida_em", "id"]

    def __str__(self):
        return f"{self.aluno.nome} → item {self.item_id}: {self.arquetipo_escolhido}"


def respostas_atuais(aluno):
    """Respostas da tentativa actual do CAT (as de tentativas anteriores não contam)."""
    return aluno.respostas_cat.filter(tentativa=aluno.tentativa_cat)
