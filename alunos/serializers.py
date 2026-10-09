from rest_framework import serializers
from .models import Aluno, NotaDisciplina


class AlunoSerializer(serializers.ModelSerializer):
    """
    Serializer do registo do perfil básico do aluno (RF01).
    """

    class Meta:
        model = Aluno
        fields = ["id", "nome", "idade", "escola"]
        read_only_fields = ["id"]

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

# --- Vista do orientador ---------------------------------------------------------

ESTADO_POR_TERMINAR = "por_terminar"
ESTADO_CONCLUIDO = "concluido"
ESTADO_PONTO_DE_ATENCAO = "ponto_de_atencao"


def _tem_alertas(alertas):
    return any(alertas.get(k) for k in ("sobrestimacao", "subestimacao")) if alertas else False


class AlunoResumoSerializer(serializers.ModelSerializer):
    """
    Linha da lista de alunos do orientador (só leitura).

    estado:
      - por_terminar: ainda não tem recomendações;
      - ponto_de_atencao: tem recomendações, mas com alerta de viés ou
        confiança baixa nas respostas do CAT;
      - concluido: tem recomendações sem alertas.
    perfil_dominante: arquétipo mais provável segundo o motor bayesiano,
    calculado com as respostas da tentativa actual.

    A view deve fazer prefetch de "recomendacoes__curso" e
    "respostas_cat__item" para não repetir consultas por aluno.
    """
    estado = serializers.SerializerMethodField()
    perfil_dominante = serializers.SerializerMethodField()
    primeira_sugestao = serializers.SerializerMethodField()
    curso_escolhido = serializers.SerializerMethodField()
    confianca = serializers.SerializerMethodField()

    class Meta:
        model = Aluno
        fields = [
            "id", "nome", "idade", "escola", "criado_em", "tentativa_cat", "estado",
            "perfil_dominante", "primeira_sugestao", "curso_escolhido", "confianca",
        ]
        read_only_fields = fields

    # As recomendações e respostas vêm do prefetch; filtrar em Python evita
    # novas consultas.
    def _recs(self, aluno):
        return sorted(aluno.recomendacoes.all(), key=lambda r: r.rank)

    def _primeira(self, aluno):
        recs = self._recs(aluno)
        return recs[0] if recs else None

    def get_estado(self, aluno):
        primeira = self._primeira(aluno)
        if primeira is None:
            return ESTADO_POR_TERMINAR
        baixa = (primeira.confianca_cat or {}).get("nivel") == "baixa"
        if baixa or _tem_alertas(primeira.alertas_vieses):
            return ESTADO_PONTO_DE_ATENCAO
        return ESTADO_CONCLUIDO

    def get_perfil_dominante(self, aluno):
        from cat import motor
        respostas = [r for r in aluno.respostas_cat.all() if r.tentativa == aluno.tentativa_cat]
        if not respostas:
            return None
        crenca = motor.calcular_crenca((r.item.tendencia, r.arquetipo_escolhido) for r in respostas)
        return motor.arquetipo_provavel(crenca)

    def get_primeira_sugestao(self, aluno):
        primeira = self._primeira(aluno)
        if primeira is None:
            return None
        return {"curso": primeira.curso_id, "nome": primeira.curso.nome,
                "instituicao": primeira.curso.instituicao}

    def get_curso_escolhido(self, aluno):
        """None = ainda não decidiu."""
        escolhida = next((r for r in self._recs(aluno) if r.escolhida_pelo_aluno), None)
        if escolhida is None:
            return None
        return {"curso": escolhida.curso_id, "nome": escolhida.curso.nome,
                "instituicao": escolhida.curso.instituicao}

    def get_confianca(self, aluno):
        primeira = self._primeira(aluno)
        if primeira is None or not primeira.confianca_cat:
            return None
        return primeira.confianca_cat.get("nivel")


class AlunoDetalheSerializer(AlunoResumoSerializer):
    """Ficha completa de um aluno para o orientador (só leitura)."""
    notas = serializers.SerializerMethodField()
    sugestoes = serializers.SerializerMethodField()
    motivos_confianca = serializers.SerializerMethodField()
    alertas_vieses = serializers.SerializerMethodField()

    class Meta(AlunoResumoSerializer.Meta):
        fields = AlunoResumoSerializer.Meta.fields + [
            "notas", "sugestoes", "motivos_confianca", "alertas_vieses",
        ]
        read_only_fields = fields

    def get_notas(self, aluno):
        return {n.disciplina: n.nota for n in aluno.notas.all()}

    def get_sugestoes(self, aluno):
        return [
            {
                "rank": r.rank, "curso": r.curso_id, "nome": r.curso.nome,
                "instituicao": r.curso.instituicao, "arquetipo": r.curso.arquetipo_dominante,
                "score_academico": r.score_academico, "score_psicografico": r.score_psicografico,
                "score_final": r.score_final, "escolhida_pelo_aluno": r.escolhida_pelo_aluno,
            }
            for r in self._recs(aluno)
        ]

    def get_motivos_confianca(self, aluno):
        primeira = self._primeira(aluno)
        return (primeira.confianca_cat or {}).get("motivos", []) if primeira else []

    def get_alertas_vieses(self, aluno):
        primeira = self._primeira(aluno)
        return primeira.alertas_vieses if primeira else {}
