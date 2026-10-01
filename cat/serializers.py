# cat/serializers.py

from rest_framework import serializers
from .models import ItemCAT
from .models import RespostaCAT


ARQUETIPOS_VALIDOS = {"Analítico", "Humanista", "Criativo", "Estrategista"}


class ItemCATSerializer(serializers.ModelSerializer):
    class Meta:
        model = ItemCAT
        fields = ["id", "texto", "tipo", "tendencia", "opcoes"]
        read_only_fields = ["id"]

    def validate_opcoes(self, value):
        if not isinstance(value, list) or len(value) != 4:
            raise serializers.ValidationError("Um ItemCAT deve ter exactamente 4 opções.")

        arquetipos_presentes = {opcao.get("arquetipo") for opcao in value}
        if arquetipos_presentes != ARQUETIPOS_VALIDOS:
            raise serializers.ValidationError(
                "As 4 opções devem cobrir exactamente os 4 arquétipos: Analítico, Humanista, Criativo, Estrategista."
            )
        return value

class RespostaCATSerializer(serializers.ModelSerializer):
    class Meta:
        model = RespostaCAT
        fields = ["id", "aluno", "item", "arquetipo_escolhido"]
        read_only_fields = ["id"]