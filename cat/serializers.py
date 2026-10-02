# cat/serializers.py

from rest_framework import serializers

from .models import ItemCAT, RespostaCAT, validar_opcoes


class ItemCATSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemCAT
        fields = [
            "id", "codigo", "texto", "tipo", "tendencia", "contexto",
            "posicao", "par_coerencia", "ativo", "opcoes",
        ]
        read_only_fields = ["id"]

    def validate_opcoes(self, value):
        erro = validar_opcoes(value)
        if erro:
            raise serializers.ValidationError(erro)
        return value


class RespostaCATSerializer(serializers.ModelSerializer):
    class Meta:
        model = RespostaCAT
        fields = ["id", "aluno", "item", "arquetipo_escolhido"]
        read_only_fields = ["id"]
