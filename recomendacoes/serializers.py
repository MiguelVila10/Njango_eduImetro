# recomendacoes/serializers.py

from rest_framework import serializers

from .models import Recomendacao


class RecomendacaoSerializer(serializers.ModelSerializer):
    # Campos de leitura para o frontend não ter de pedir cada curso à parte.
    curso_nome = serializers.CharField(source="curso.nome", read_only=True)
    curso_instituicao = serializers.CharField(source="curso.instituicao", read_only=True)
    curso_arquetipo = serializers.CharField(source="curso.arquetipo_dominante", read_only=True)

    class Meta:
        model = Recomendacao
        fields = [
            "id", "aluno", "curso", "curso_nome", "curso_instituicao", "curso_arquetipo",
            "score_academico", "score_psicografico", "score_final", "rank",
            "escolhida_pelo_aluno", "alertas_vieses", "confianca_cat",
        ]
        read_only_fields = ["id"]
