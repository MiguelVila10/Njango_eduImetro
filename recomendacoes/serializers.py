# recomendacoes/serializers.py

from collections import Counter

from rest_framework import serializers

from alunos.sessao import eh_orientador
from cat.models import respostas_atuais
from cat.motor import ARQUETIPOS
from .models import Recomendacao

# Dados internos do motor que só o orientador vê. O aluno não deve ver
# "alertas de viés" nem o nível de confiança das suas respostas: são
# instrumentos de trabalho do orientador, não mensagens para o aluno.
CAMPOS_SO_ORIENTADOR = ("alertas_vieses", "confianca_cat")


class RecomendacaoSerializer(serializers.ModelSerializer):
    # Campos de leitura para o frontend não ter de pedir cada curso à parte.
    curso_nome = serializers.CharField(source="curso.nome", read_only=True)
    curso_instituicao = serializers.CharField(source="curso.instituicao", read_only=True)
    curso_arquetipo = serializers.CharField(source="curso.arquetipo_dominante", read_only=True)
    curso_descricao = serializers.CharField(source="curso.descricao", read_only=True)
    disciplinas_chave = serializers.SerializerMethodField()
    notas_minimas = serializers.SerializerMethodField()
    perfil_aluno = serializers.SerializerMethodField()

    class Meta:
        model = Recomendacao
        fields = [
            "id", "aluno", "curso", "curso_nome", "curso_instituicao", "curso_arquetipo",
            "curso_descricao", "score_academico", "score_psicografico", "score_final", "rank",
            "escolhida_pelo_aluno", "disciplinas_chave", "notas_minimas", "perfil_aluno",
            "alertas_vieses", "confianca_cat",
        ]
        read_only_fields = ["id"]

    def get_disciplinas_chave(self, rec):
        """
        Justificação para o ecrã "porque este curso": as disciplinas mais
        importantes do curso (maior valor de referência), com a nota do aluno
        ao lado. Até 4 disciplinas.
        """
        notas = {n.disciplina: n.nota for n in rec.aluno.notas.all()}
        vetores = sorted(rec.curso.vetores_ideais.all(), key=lambda v: (-v.peso_ideal, v.disciplina))
        return [
            {
                "disciplina": v.disciplina,
                "tua_nota": notas.get(v.disciplina),
                "referencia": v.peso_ideal,
            }
            for v in vetores[:4]
        ]

    def get_notas_minimas(self, rec):
        """
        Pré-requisitos do curso (filtro SE-ENTÃO) com a nota do aluno ao lado,
        para o ecrã do curso explicar porque o curso entrou na lista.
        """
        notas = {n.disciplina: n.nota for n in rec.aluno.notas.all()}
        return [
            {"disciplina": p.disciplina, "nota_min": p.nota_min, "tua_nota": notas.get(p.disciplina)}
            for p in sorted(rec.curso.prerequisitos.all(), key=lambda p: (-p.nota_min, p.disciplina))
        ]

    def get_perfil_aluno(self, rec):
        """
        Como as respostas do aluno ao teste (tentativa actual) se repartem pelos
        4 perfis. Serve para o ecrã explicar a parte "respostas" do score
        (score_psicografico = respostas do perfil do curso / total).
        """
        cache = self.context.setdefault("_perfil_por_aluno", {})
        if rec.aluno_id not in cache:
            contagem = Counter(respostas_atuais(rec.aluno).values_list("arquetipo_escolhido", flat=True))
            total = sum(contagem.values())
            cache[rec.aluno_id] = {
                "total": total,
                "arquetipos": sorted(
                    (
                        {"arquetipo": a, "respostas": contagem.get(a, 0),
                         "percentagem": round(contagem.get(a, 0) / total, 4) if total else 0}
                        for a in ARQUETIPOS
                    ),
                    key=lambda x: -x["respostas"],
                ),
            }
        return cache[rec.aluno_id]

    def to_representation(self, instance):
        dados = super().to_representation(instance)
        request = self.context.get("request")
        if request is None or not eh_orientador(request):
            for campo in CAMPOS_SO_ORIENTADOR:
                dados.pop(campo, None)
        return dados
