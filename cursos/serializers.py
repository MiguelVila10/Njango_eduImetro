from rest_framework import serializers

from alunos.sessao import eh_orientador
from .models import Curso, PreRequisitoCurso, VetorIdealCurso

# Contagens calculadas na view (annotate); só o orientador as vê.
CONTAGENS_CURSO = ("vezes_sugerido", "vezes_primeiro", "vezes_escolhido")


class CursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Curso
        fields = ["id", "nome", "instituicao", "arquetipo_dominante", "descricao"]
        read_only_fields = ["id"]

    def to_representation(self, instance):
        dados = super().to_representation(instance)
        request = self.context.get("request")
        if request is not None and eh_orientador(request):
            for campo in CONTAGENS_CURSO:
                dados[campo] = getattr(instance, campo, 0)
        return dados


class PreRequisitoCursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreRequisitoCurso
        fields = ["id", "curso", "disciplina", "nota_min"]
        read_only_fields = ["id"]


class VetorIdealCursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = VetorIdealCurso
        fields = ["id", "curso", "disciplina", "peso_ideal"]
        read_only_fields = ["id"]