from rest_framework import serializers
from .models import Aluno, NotaDisciplina


class AlunoSerializer(serializers.ModelSerializer):
    """
    Serializer do registo do perfil básico do aluno (RF01).
    """

    class Meta:
        model = Aluno
        fields = ["id", "nome", "idade", "escola", "codigo_acesso", "solicitacoes_orientacao"]
        read_only_fields = ["id", "codigo_acesso", "solicitacoes_orientacao"]

    def validate_idade(self, value):
        if value <= 0:
            raise serializers.ValidationError("A idade deve ser um valor positivo.")
        return value

class NotaDisciplinaSerializer(serializers.ModelSerializer):
    """Serializer da nota por disciplina (RF02, RF03)."""

    class Meta:
        model = NotaDisciplina
        fields = ["id", "aluno", "disciplina", "nota"]
        read_only_fields = ["id"]