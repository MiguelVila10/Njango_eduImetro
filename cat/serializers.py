# cat/serializers.py

import random

from rest_framework import serializers

from .models import ItemCAT, RespostaCAT, validar_opcoes
from .motor import ARQUETIPOS

POSICOES = "ABCD"


class ItemCATSerializer(serializers.ModelSerializer):
    """
    Versão completa (orientador): inclui o arquétipo de cada opção.

    Ao criar uma pergunta de verificação, "confirma" indica a pergunta
    principal que ela confirma: as duas ficam no mesmo par de coerência (usa o
    par da principal ou cria um novo, P1, P2, ...).
    """
    confirma = serializers.PrimaryKeyRelatedField(
        queryset=ItemCAT.objects.filter(tipo="nucleo"), write_only=True, required=False, allow_null=True,
        error_messages={"does_not_exist": "Escolha uma pergunta principal da lista."},
    )

    class Meta:
        model = ItemCAT
        fields = [
            "id", "codigo", "texto", "tipo", "tendencia", "contexto",
            "posicao", "par_coerencia", "ativo", "opcoes", "confirma",
        ]
        read_only_fields = ["id"]
        extra_kwargs = {
            "texto": {"error_messages": {"blank": "Escreva a situação da pergunta."}},
            "tendencia": {"error_messages": {"invalid_choice": "Escolha um dos 4 perfis (ou nenhum)."}},
        }

    def to_representation(self, instance):
        # Contagem de respostas por arquétipo (só a versão do orientador
        # usa este serializer). Vem do annotate da view; num item acabado
        # de criar é zero.
        dados = super().to_representation(instance)
        por_arquetipo = {a: getattr(instance, f"_resp_{i}", 0) for i, a in enumerate(ARQUETIPOS)}
        dados["respostas_por_arquetipo"] = por_arquetipo
        dados["total_respostas"] = getattr(instance, "_resp_total", 0)
        if instance.par_coerencia:
            par = (ItemCAT.objects.filter(par_coerencia=instance.par_coerencia)
                   .exclude(pk=instance.pk).values("id", "texto").first())
            dados["par"] = par
        else:
            dados["par"] = None
        return dados

    def validate_texto(self, value):
        texto = " ".join((value or "").split())
        if len(texto) < 10:
            raise serializers.ValidationError("Descreva a situação com um pouco mais de detalhe.")
        return texto

    def validate_opcoes(self, value):
        if isinstance(value, list):
            for o in value:
                if isinstance(o, dict) and isinstance(o.get("texto"), str):
                    o["texto"] = " ".join(o["texto"].split())
        erro = validar_opcoes(value)
        if erro:
            if "texto" in erro:
                erro = "Escreva o texto de todas as opções. Cada pergunta precisa de uma opção para cada perfil."
            raise serializers.ValidationError(erro)
        return value

    def validate(self, attrs):
        tipo = attrs.get("tipo", getattr(self.instance, "tipo", "nucleo"))
        confirma = attrs.get("confirma")
        ja_tem_par = bool(getattr(self.instance, "par_coerencia", ""))
        if tipo == "verificacao" and confirma is None and not ja_tem_par and not attrs.get("par_coerencia"):
            raise serializers.ValidationError(
                {"confirma": "Uma pergunta de verificação tem de confirmar uma pergunta principal."}
            )
        if confirma is not None and self.instance is not None and confirma.pk == self.instance.pk:
            raise serializers.ValidationError({"confirma": "Escolha outra pergunta."})
        return attrs

    @staticmethod
    def _novo_par():
        usados = {p for p in ItemCAT.objects.exclude(par_coerencia="").values_list("par_coerencia", flat=True)}
        n = 1
        while f"P{n}" in usados:
            n += 1
        return f"P{n}"

    def _ligar_par(self, item, confirma):
        if confirma is None or item.tipo != "verificacao":
            return
        if not confirma.par_coerencia:
            confirma.par_coerencia = self._novo_par()
            confirma.save(update_fields=["par_coerencia"])
        item.par_coerencia = confirma.par_coerencia
        item.save(update_fields=["par_coerencia"])

    def create(self, validated_data):
        confirma = validated_data.pop("confirma", None)
        item = super().create(validated_data)
        self._ligar_par(item, confirma)
        return item

    def update(self, instance, validated_data):
        confirma = validated_data.pop("confirma", None)
        item = super().update(instance, validated_data)
        self._ligar_par(item, confirma)
        return item


def item_para_aluno(item, aluno):
    """
    Versão que o aluno recebe: sem tendência nem arquétipos, com as opções
    baralhadas. Cada opção leva o seu número original ("opcao"), que o
    frontend devolve ao responder. A ordem é fixa para o mesmo aluno e item,
    para não mudar se a página for recarregada.
    """
    opcoes = [{"opcao": i, "texto": o["texto"]} for i, o in enumerate(item.opcoes)]
    random.Random(f"{aluno.pk}-{item.pk}-{aluno.tentativa_cat}").shuffle(opcoes)
    for posicao, opcao in zip(POSICOES, opcoes):
        opcao["posicao"] = posicao
    return {"id": item.pk, "texto": item.texto, "opcoes": opcoes}


class RespostaCATSerializer(serializers.ModelSerializer):
    """
    O frontend envia o número da opção escolhida ("opcao", 0 a 3) e o
    servidor descobre o arquétipo. Também aceita "arquetipo_escolhido"
    directamente (testes e ferramentas internas).
    """
    opcao = serializers.IntegerField(write_only=True, required=False, min_value=0, max_value=3)

    class Meta:
        model = RespostaCAT
        fields = [
            "id", "aluno", "item", "opcao", "arquetipo_escolhido",
            "tempo_resposta_ms", "posicao_ecra", "tentativa",
        ]
        read_only_fields = ["id", "tentativa"]
        extra_kwargs = {"arquetipo_escolhido": {"required": False}}
        validators = []  # a unicidade (aluno, item, tentativa) é verificada em validate()

    def validate(self, attrs):
        aluno = attrs.get("aluno", getattr(self.instance, "aluno", None))
        item = attrs.get("item", getattr(self.instance, "item", None))
        opcao = attrs.pop("opcao", None)

        if self.instance is None and not item.ativo:
            raise serializers.ValidationError({"item": "Esta pergunta já não está activa."})

        if opcao is not None:
            attrs["arquetipo_escolhido"] = item.opcoes[opcao]["arquetipo"]
        elif not attrs.get("arquetipo_escolhido") and self.instance is None:
            raise serializers.ValidationError({"opcao": "Indica a opção escolhida."})

        if self.instance is None:
            tentativa = aluno.tentativa_cat
            if RespostaCAT.objects.filter(aluno=aluno, item=item, tentativa=tentativa).exists():
                raise serializers.ValidationError("Esta pergunta já foi respondida nesta tentativa.")
            attrs["tentativa"] = tentativa
        return attrs
