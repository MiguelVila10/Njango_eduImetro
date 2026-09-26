from rest_framework import serializers
from .models import Recomendacao


class RecomendacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recomendacao
        fields = ["id", "aluno", "curso", "score_academico", "score_psicografico", "score_final", "rank", "escolhida_pelo_aluno", "alertas_vieses"]
        read_only_fields = ["id"]
