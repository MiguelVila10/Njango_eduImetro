from django.db import transaction
from rest_framework import serializers

from alunos.sessao import eh_orientador
from .models import Curso, PreRequisitoCurso, VetorIdealCurso

# Contagens calculadas na view (annotate); só o orientador as vê.
CONTAGENS_CURSO = ("vezes_sugerido", "vezes_primeiro", "vezes_escolhido")

INSTITUICOES = ["ITEL", "IPIL", "IMEL", "IMS", "CEARTE"]
DISCIPLINAS = [
    "Português", "Matemática", "Física", "Química", "Biologia", "História", "Geografia",
    "Língua Estrangeira", "Educação Moral e Cívica", "Educação Física", "Educação Visual",
    "Educação Laboral",
]
NOTA_FORA = "A nota tem de estar entre 10 e 20."


class _NotaDisciplina(serializers.Serializer):
    disciplina = serializers.ChoiceField(choices=DISCIPLINAS, error_messages={"invalid_choice": "Escolha uma disciplina da lista."})


class PreRequisitoEscritaSerializer(_NotaDisciplina):
    nota_min = serializers.IntegerField(min_value=10, max_value=20, error_messages={
        "min_value": NOTA_FORA, "max_value": NOTA_FORA, "invalid": NOTA_FORA, "required": "Indique a nota mínima."})


class NotaIdealEscritaSerializer(_NotaDisciplina):
    peso_ideal = serializers.IntegerField(min_value=10, max_value=20, error_messages={
        "min_value": NOTA_FORA, "max_value": NOTA_FORA, "invalid": NOTA_FORA, "required": "Indique a nota ideal."})


class CursoSerializer(serializers.ModelSerializer):
    """
    Curso do catálogo (RF12: o orientador adiciona e edita; ninguém apaga).

    Na escrita aceita, no mesmo pedido, os pré-requisitos (filtro SE-ENTÃO) e as
    notas ideais (vector ideal), que substituem os anteriores quando enviados.
    As sugestões já feitas aos alunos ficam como estavam.
    """
    prerequisitos = PreRequisitoEscritaSerializer(many=True, required=False, write_only=True)
    notas_ideais = NotaIdealEscritaSerializer(many=True, required=False, write_only=True)

    class Meta:
        model = Curso
        fields = ["id", "nome", "instituicao", "arquetipo_dominante", "descricao", "prerequisitos", "notas_ideais"]
        read_only_fields = ["id"]
        extra_kwargs = {
            "nome": {"error_messages": {"blank": "Indique o nome do curso."}},
            "arquetipo_dominante": {"error_messages": {"invalid_choice": "Escolha o perfil dominante."}},
        }

    def validate_nome(self, value):
        nome = " ".join((value or "").split())
        if sum(c.isalpha() for c in nome) < 3:
            raise serializers.ValidationError("Indique o nome do curso.")
        return nome

    def validate_instituicao(self, value):
        valor = (value or "").strip().upper()
        if valor not in INSTITUICOES:
            raise serializers.ValidationError("Escolha uma das escolas da lista.")
        return valor

    def validate_descricao(self, value):
        return (value or "").strip()

    @staticmethod
    def _sem_repetidas(lista, campo):
        disciplinas = [d["disciplina"] for d in lista]
        repetidas = sorted({d for d in disciplinas if disciplinas.count(d) > 1})
        if repetidas:
            raise serializers.ValidationError(f"{repetidas[0]} aparece mais do que uma vez.")
        return lista

    def validate_prerequisitos(self, value):
        return self._sem_repetidas(value, "nota_min")

    def validate_notas_ideais(self, value):
        self._sem_repetidas(value, "peso_ideal")
        faltam = [d for d in DISCIPLINAS if d not in {n["disciplina"] for n in value}]
        if faltam:
            raise serializers.ValidationError("Indique a nota ideal das 12 disciplinas.")
        return value

    def validate(self, attrs):
        nome = attrs.get("nome", getattr(self.instance, "nome", None))
        instituicao = attrs.get("instituicao", getattr(self.instance, "instituicao", None))
        if nome and instituicao:
            repetido = Curso.objects.filter(nome__iexact=nome, instituicao=instituicao)
            if self.instance is not None:
                repetido = repetido.exclude(pk=self.instance.pk)
            if repetido.exists():
                raise serializers.ValidationError({"nome": "Já existe um curso com este nome nesta escola."})
        return attrs

    @staticmethod
    def _gravar_regras(curso, prerequisitos, notas_ideais):
        if prerequisitos is not None:
            curso.prerequisitos.all().delete()
            PreRequisitoCurso.objects.bulk_create(
                PreRequisitoCurso(curso=curso, disciplina=p["disciplina"], nota_min=p["nota_min"]) for p in prerequisitos
            )
        if notas_ideais is not None:
            curso.vetores_ideais.all().delete()
            VetorIdealCurso.objects.bulk_create(
                VetorIdealCurso(curso=curso, disciplina=n["disciplina"], peso_ideal=n["peso_ideal"]) for n in notas_ideais
            )

    @transaction.atomic
    def create(self, validated_data):
        prerequisitos = validated_data.pop("prerequisitos", None)
        notas_ideais = validated_data.pop("notas_ideais", None)
        curso = super().create(validated_data)
        self._gravar_regras(curso, prerequisitos, notas_ideais)
        return curso

    @transaction.atomic
    def update(self, instance, validated_data):
        prerequisitos = validated_data.pop("prerequisitos", None)
        notas_ideais = validated_data.pop("notas_ideais", None)
        curso = super().update(instance, validated_data)
        self._gravar_regras(curso, prerequisitos, notas_ideais)
        return curso

    def to_representation(self, instance):
        dados = super().to_representation(instance)
        request = self.context.get("request")
        if request is not None and eh_orientador(request):
            for campo in CONTAGENS_CURSO:
                dados[campo] = getattr(instance, campo, 0)
            ordem = {d: i for i, d in enumerate(DISCIPLINAS)}
            dados["prerequisitos"] = sorted(
                ({"disciplina": p.disciplina, "nota_min": p.nota_min} for p in instance.prerequisitos.all()),
                key=lambda p: (-p["nota_min"], ordem.get(p["disciplina"], 99)),
            )
            dados["notas_ideais"] = sorted(
                ({"disciplina": v.disciplina, "peso_ideal": v.peso_ideal} for v in instance.vetores_ideais.all()),
                key=lambda v: ordem.get(v["disciplina"], 99),
            )
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
