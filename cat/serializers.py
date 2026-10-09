# cat/serializers.py

import random

from rest_framework import serializers

from .models import ItemCAT, RespostaCAT, validar_opcoes
from .motor import ARQUETIPOS

POSICOES = "ABCD"


class ItemCATSerializer(serializers.ModelSerializer):
    """Versão completa (orientador): inclui o arquétipo de cada opção."""

    class Meta:
        model = ItemCAT
        fields = [
            "id", "codigo", "texto", "tipo", "tendencia", "contexto",
            "posicao", "par_coerencia", "ativo", "opcoes",
        ]
        read_only_fields = ["id"]

    def to_representation(self, instance):
        # Contagem de respostas por arquétipo (só a versão do orientador
        # usa este serializer). Vem do annotate da view; num item acabado
        # de criar é zero.
        dados = super().to_representation(instance)
        por_arquetipo = {a: getattr(instance, f"_resp_{i}", 0) for i, a in enumerate(ARQUETIPOS)}
        dados["respostas_por_arquetipo"] = por_arquetipo
        dados["total_respostas"] = getattr(instance, "_resp_total", 0)
        return dados

    def validate_opcoes(self, value):
        erro = validar_opcoes(value)
        if erro:
            raise serializers.ValidationError(erro)
        return value


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
