# recomendacoes/serializers.py

from collections import Counter

from rest_framework import serializers

from alunos.sessao import eh_orientador
from cat.models import respostas_atuais
from cat.motor import ARQUETIPOS
from .models import Recomendacao


def resumo_perfil(aluno, cursos_sugeridos=None):
    """
    Como as respostas do aluno (tentativa actual) se repartem pelos 4 perfis,
    com o(s) perfil(is) mais escolhido(s) — "dominantes" tem mais de um em
    caso de empate.

    Se nenhuma sugestão é de um perfil dominante, explica porquê
    ("perfil_sem_sugestao"): os cursos desse perfil que o filtro SE-ENTÃO
    eliminou (com o que falta em cada disciplina) e quantos passaram o
    filtro mas ficaram abaixo por causa das notas. O motor não muda: as
    notas mínimas das escolas são eliminatórias; isto só torna visível o
    que aconteceu (transparência).
    """
    from filtro_regras.services import filtrar_cursos

    contagem = Counter(respostas_atuais(aluno).values_list("arquetipo_escolhido", flat=True))
    total = sum(contagem.values())
    maximo = max((contagem.get(a, 0) for a in ARQUETIPOS), default=0)
    dominantes = [a for a in ARQUETIPOS if maximo and contagem.get(a, 0) == maximo]
    resumo = {
        "total": total,
        "arquetipos": sorted(
            (
                {"arquetipo": a, "respostas": contagem.get(a, 0),
                 "percentagem": round(contagem.get(a, 0) / total, 4) if total else 0}
                for a in ARQUETIPOS
            ),
            key=lambda x: -x["respostas"],
        ),
        "dominantes": dominantes,
        "perfil_sem_sugestao": None,
    }
    if cursos_sugeridos is None:
        cursos_sugeridos = [r.curso for r in aluno.recomendacoes.select_related("curso")]
    if not dominantes or not cursos_sugeridos or any(c.arquetipo_dominante in dominantes for c in cursos_sugeridos):
        return resumo

    aprovados, eliminacoes = filtrar_cursos(aluno)
    fora = [
        {
            "curso_nome": e["curso"].nome,
            "curso_instituicao": e["curso"].instituicao,
            "curso_arquetipo": e["curso"].arquetipo_dominante,
            "faltas": e["faltas"],
        }
        for e in sorted(eliminacoes, key=lambda e: (sum(f["falta"] for f in e["faltas"]), e["curso"].nome))
        if e["curso"].arquetipo_dominante in dominantes
    ]
    resumo["perfil_sem_sugestao"] = {
        "eliminados": fora,
        "passaram_mas_abaixo": sum(1 for c in aprovados if c.arquetipo_dominante in dominantes),
    }
    return resumo

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
            cache[rec.aluno_id] = resumo_perfil(rec.aluno)
        return cache[rec.aluno_id]

    def to_representation(self, instance):
        dados = super().to_representation(instance)
        request = self.context.get("request")
        if request is None or not eh_orientador(request):
            for campo in CAMPOS_SO_ORIENTADOR:
                dados.pop(campo, None)
        return dados
