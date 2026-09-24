from rest_framework import serializers
from .models import Curso, PreRequisitoCurso, VetorIdealCurso


class CursoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Curso
        fields = ["id", "nome", "instituicao", "arquetipo_dominante"]
        read_only_fields = ["id"]


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