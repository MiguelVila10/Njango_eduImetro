import re

from rest_framework import serializers
from .models import Aluno, NotaDisciplina

# Nome: só letras (com acentos), separadas por espaço, hífen ou apóstrofo.
# Ex.: "Ana Kiluange", "João-Pedro", "N'Gola". Recusa "***", "///", "a1".
NOME_VALIDO = re.compile(r"^[^\W\d_]+(?:[ '’-][^\W\d_]+)*$")
# Escola: letras, números e a pontuação habitual nos nomes de escolas.
# Ex.: "Escola do I Ciclo n.º 1234", "Colégio S. José (Cazenga)".
ESCOLA_CARACTERES = re.compile(r"^[^\W_](?:[^\W_]|[ .,ºª°'’/()\-])*$")
SIMBOLOS_SEGUIDOS = re.compile(r"[^\w\s]{3,}")
IDADE_MIN, IDADE_MAX = 10, 25


def _normalizar_espacos(valor):
    return re.sub(r"\s+", " ", valor or "").strip()


def _letras(valor):
    return sum(1 for c in valor if c.isalpha())


class AlunoSerializer(serializers.ModelSerializer):
    """
    Serializer do registo do perfil básico do aluno (RF01).
    """

    class Meta:
        model = Aluno
        fields = ["id", "nome", "idade", "escola"]
        read_only_fields = ["id"]

    def validate_nome(self, value):
        nome = _normalizar_espacos(value)
        if not NOME_VALIDO.match(nome):
            raise serializers.ValidationError("O nome só pode ter letras, espaços, hífen ou apóstrofo.")
        if _letras(nome) < 2:
            raise serializers.ValidationError("O nome é muito curto.")
        if len(nome) > 60:
            raise serializers.ValidationError("O nome é muito longo (máximo 60 caracteres).")
        return nome

    def validate_escola(self, value):
        escola = _normalizar_espacos(value)
        if not ESCOLA_CARACTERES.match(escola) or SIMBOLOS_SEGUIDOS.search(escola) or _letras(escola) < 3:
            raise serializers.ValidationError("Escreve o nome da escola com letras (podes usar números, como n.º 1234).")
        if len(escola) > 120:
            raise serializers.ValidationError("O nome da escola é muito longo (máximo 120 caracteres).")
        return escola

    def validate_idade(self, value):
        if not IDADE_MIN <= value <= IDADE_MAX:
            raise serializers.ValidationError(f"A idade tem de estar entre {IDADE_MIN} e {IDADE_MAX} anos.")
        return value

class NotaDisciplinaSerializer(serializers.ModelSerializer):
    """Serializer da nota por disciplina (RF02, RF03)."""

    class Meta:
        model = NotaDisciplina
        fields = ["id", "aluno", "disciplina", "nota"]
        read_only_fields = ["id"]

# --- Vista do orientador ---------------------------------------------------------

from .estado import carregar_cursos, compatibilidade, estado_do_aluno


class AlunoResumoSerializer(serializers.ModelSerializer):
    """
    Linha da lista de alunos do orientador (só leitura).

    estado: ver alunos/estado.py (por_terminar, sem_curso_compativel,
    ponto_de_atencao, concluido).
    perfil_dominante: arquétipo mais provável segundo o motor bayesiano,
    calculado com as respostas da tentativa actual.

    A view deve fazer prefetch de "recomendacoes__curso" e
    "respostas_cat__item" e "notas" para não repetir consultas por aluno.
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

    def _cursos(self):
        # Um serializer de lista usa a mesma instância para todos os alunos:
        # o catálogo carrega-se uma só vez por pedido.
        if not hasattr(self, "_cache_cursos"):
            self._cache_cursos = carregar_cursos()
        return self._cache_cursos

    def get_estado(self, aluno):
        return estado_do_aluno(aluno, self._cursos())

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
    cursos_proximos = serializers.SerializerMethodField()
    motivos_confianca = serializers.SerializerMethodField()
    alertas_vieses = serializers.SerializerMethodField()

    class Meta(AlunoResumoSerializer.Meta):
        fields = AlunoResumoSerializer.Meta.fields + [
            "notas", "sugestoes", "cursos_proximos", "motivos_confianca", "alertas_vieses",
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

    def get_cursos_proximos(self, aluno):
        """Só para alunos sem curso compatível: os 3 cursos mais perto e o que falta."""
        if self._recs(aluno):
            return []
        resultado = compatibilidade(aluno, self._cursos())
        if resultado is None or resultado[0]:
            return []
        from recomendacoes.services import cursos_mais_proximos
        return cursos_mais_proximos(resultado[1], self.get_perfil_dominante(aluno))

    def get_motivos_confianca(self, aluno):
        primeira = self._primeira(aluno)
        return (primeira.confianca_cat or {}).get("motivos", []) if primeira else []

    def get_alertas_vieses(self, aluno):
        primeira = self._primeira(aluno)
        return primeira.alertas_vieses if primeira else {}
