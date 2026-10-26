# alunos/management/commands/explicar_aluno.py
"""
Explica, passo a passo, porque o motor sugeriu aqueles cursos a um aluno.
Só lê: não altera nada na base de dados.

Mostra:
  1. as 12 notas do aluno;
  2. as respostas ao teste por perfil (as que o motor usa);
  3. os cursos eliminados pelo filtro SE-ENTÃO (e porquê);
  4. a tabela completa de todos os cursos que passaram o filtro, com
     Notas (60%) + Teste (40%) = Final, ordenada como o motor ordena;
  5. avisos se algum curso tiver um perfil escrito de forma diferente da
     usada nas perguntas (nesse caso o teste não lhe dá pontos).

Uso:
    python manage.py explicar_aluno "Nome do aluno"     (o mais recente com esse nome)
    python manage.py explicar_aluno --id 12
    python manage.py explicar_aluno                     (o último aluno que fez o teste)
"""

from collections import Counter

from django.core.management.base import BaseCommand, CommandError

from alunos.models import Aluno
from cat.models import respostas_atuais
from cat.motor import ARQUETIPOS
from cursos.models import Curso
from filtro_regras.services import filtrar_cursos
from similaridade.services import calcular_similaridade


def _pct(v):
    return f"{round(v * 100):>3d}%"


class Command(BaseCommand):
    help = "Explica porque o motor sugeriu aqueles cursos a um aluno (só lê)."

    def add_arguments(self, parser):
        parser.add_argument("nome", nargs="?", help="Nome (ou parte do nome) do aluno.")
        parser.add_argument("--id", type=int, help="Id do aluno.")

    def handle(self, *args, **opts):
        aluno = self._escolher(opts)
        out = self.stdout.write

        out(self.style.MIGRATE_HEADING(f"\nAluno: {aluno.nome} (id {aluno.pk}) · {aluno.escola} · tentativa {aluno.tentativa_cat}"))

        # 1. Notas
        notas = {n.disciplina: n.nota for n in aluno.notas.all()}
        out(self.style.MIGRATE_HEADING("\n1) Notas"))
        out("   " + " · ".join(f"{d} {n}" for d, n in notas.items()))

        # 2. Respostas por perfil
        respostas = list(respostas_atuais(aluno))
        total = len(respostas)
        contagem = Counter(r.arquetipo_escolhido for r in respostas)
        out(self.style.MIGRATE_HEADING(f"\n2) Respostas ao teste ({total}) - o que o motor usa"))
        for arq in ARQUETIPOS:
            n = contagem.get(arq, 0)
            out(f"   {arq:<13} {n:>2}  {_pct(n / total) if total else '  -'}")
        estranhos = {a: n for a, n in contagem.items() if a not in ARQUETIPOS}
        if estranhos:
            out(self.style.ERROR(f"   ATENÇÃO: respostas com perfis desconhecidos: {estranhos!r}"))

        # 5. Perfis dos cursos (verificação)
        cursos_maus = [c for c in Curso.objects.all() if c.arquetipo_dominante not in ARQUETIPOS]
        if cursos_maus:
            out(self.style.ERROR("\nATENÇÃO: cursos com um perfil escrito de forma diferente (o teste não lhes dá pontos):"))
            for c in cursos_maus:
                out(self.style.ERROR(f"   {c.nome} ({c.instituicao}): {c.arquetipo_dominante!r}"))

        # 3. Filtro
        aprovados, eliminacoes = filtrar_cursos(aluno)
        out(self.style.MIGRATE_HEADING(f"\n3) Filtro SE-ENTÃO: {len(aprovados)} cursos passam, {len(eliminacoes)} ficam de fora"))
        por_perfil = Counter(c.arquetipo_dominante for c in aprovados)
        out("   Passam por perfil: " + " · ".join(f"{a} {por_perfil.get(a, 0)}" for a in ARQUETIPOS))
        for e in eliminacoes:
            faltas = ", ".join(f"{f['disciplina']} {f['nota']} (mín. {f['nota_min']})" for f in e["faltas"])
            out(f"   fora: {e['curso'].nome} [{e['curso'].arquetipo_dominante}] - {faltas}")

        # 4. Tabela completa
        out(self.style.MIGRATE_HEADING("\n4) Todos os cursos que passaram: Notas x 0,6 + Teste x 0,4 = Final"))
        linhas = []
        for c in aprovados:
            ac = calcular_similaridade(aluno, c)
            ps = contagem.get(c.arquetipo_dominante, 0) / total if total else 0
            linhas.append((0.6 * ac + 0.4 * ps, ac, ps, c))
        linhas.sort(key=lambda l: l[0], reverse=True)
        out(f"   {'#':>2}  {'Curso':<44} {'Perfil':<13} {'Notas':>5} {'Teste':>5} {'Final':>5}")
        for i, (fin, ac, ps, c) in enumerate(linhas, start=1):
            linha = f"   {i:>2}  {(c.nome + ' (' + c.instituicao + ')')[:44]:<44} {c.arquetipo_dominante:<13} {_pct(ac):>5} {_pct(ps):>5} {_pct(fin):>5}"
            out(self.style.SUCCESS(linha) if i <= 3 else linha)

        guardadas = list(aluno.recomendacoes.select_related("curso").order_by("rank"))
        if guardadas:
            out(self.style.MIGRATE_HEADING("\nSugestões guardadas para este aluno"))
            for r in guardadas:
                marca = "  <- escolhido" if r.escolhida_pelo_aluno else ""
                out(f"   {r.rank}.º {r.curso.nome}: Notas {_pct(r.score_academico)} · Teste {_pct(r.score_psicografico)} · Final {_pct(r.score_final)}{marca}")
        out("")

    def _escolher(self, opts):
        if opts.get("id"):
            aluno = Aluno.objects.filter(pk=opts["id"]).first()
        elif opts.get("nome"):
            aluno = Aluno.objects.filter(nome__icontains=opts["nome"]).order_by("-criado_em").first()
        else:
            aluno = Aluno.objects.filter(respostas_cat__isnull=False).order_by("-criado_em").distinct().first()
        if aluno is None:
            raise CommandError("Não encontrei esse aluno.")
        return aluno
