# alunos/management/commands/juntar_alunos.py
"""
Junta a este computador os alunos de uma cópia feita noutro computador
(copiar_dados.bat → njangoedu_copia.json), SEM apagar nada do que já cá está.

Para cada aluno da cópia traz: as notas, as respostas ao teste e as sugestões
(com a escolha). Não traz contas de orientador nem pedidos de conta: as
contas deste computador ficam como estão.

- Um aluno que já exista aqui (mesmo nome, escola, idade e data de registo)
  não é repetido; pode correr-se o comando mais do que uma vez.
- Os alunos da "Escola de demonstração" ficam de fora (são simulados e cada
  computador tem os seus); para os trazer, usar --com-demonstracao.
- As perguntas reconhecem-se pelo código (ex.: AN-01) ou, sem código, pelo
  texto. Uma pergunta que não exista aqui é criada DESACTIVADA (guarda as
  respostas, mas não entra no teste deste computador).
- Os cursos reconhecem-se pelo nome e escola. Um curso que não exista aqui é
  criado com os seus pré-requisitos e notas ideais.

Uso:
    python manage.py juntar_alunos C:\\dev\\njangoedu_copia.json --simular   (só mostra o que faria)
    python manage.py juntar_alunos C:\\dev\\njangoedu_copia.json
"""

import json
from collections import defaultdict
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.dateparse import parse_datetime

from alunos.models import Aluno, NotaDisciplina
from cat.models import ItemCAT, RespostaCAT
from cursos.models import Curso, PreRequisitoCurso, VetorIdealCurso
from recomendacoes.models import Recomendacao


class Simulacao(Exception):
    """Usada para desfazer tudo no fim de uma simulação."""


def _data(valor):
    return parse_datetime(valor) if isinstance(valor, str) else valor


class Command(BaseCommand):
    help = "Junta os alunos de uma cópia (njangoedu_copia.json) sem apagar os dados deste computador."

    def add_arguments(self, parser):
        parser.add_argument("ficheiro", help="Caminho do njangoedu_copia.json")
        parser.add_argument("--simular", action="store_true", help="Mostra o que faria, sem gravar nada.")
        parser.add_argument(
            "--com-demonstracao", action="store_true",
            help='Traz também os alunos da "Escola de demonstração" (por omissão ficam de fora: são simulados).',
        )

    def handle(self, *args, **opts):
        caminho = Path(opts["ficheiro"])
        if not caminho.exists():
            raise CommandError(f"Não encontrei o ficheiro {caminho}")
        try:
            objectos = json.loads(caminho.read_text(encoding="utf-8"))
        except (ValueError, UnicodeDecodeError) as erro:
            raise CommandError(f"O ficheiro não parece uma cópia do Njango Edu: {erro}")

        por_modelo = defaultdict(list)
        for o in objectos:
            por_modelo[o.get("model")].append(o)
        if not por_modelo.get("alunos.aluno"):
            raise CommandError("A cópia não tem alunos.")

        self.contagem = defaultdict(int)
        try:
            with transaction.atomic():
                self._juntar(por_modelo, com_demo=opts["com_demonstracao"])
                if opts["simular"]:
                    raise Simulacao
        except Simulacao:
            self.stdout.write(self.style.WARNING("SIMULAÇÃO: nada foi gravado. Isto é o que aconteceria:"))
        self._resumo(opts["simular"])

    # ---------- correspondências ----------

    def _mapa_itens(self, por_modelo):
        mapa = {}
        for o in por_modelo.get("cat.itemcat", []):
            f = o["fields"]
            item = None
            if f.get("codigo"):
                item = ItemCAT.objects.filter(codigo=f["codigo"]).first()
            if item is None:
                item = ItemCAT.objects.filter(texto=f["texto"]).order_by("id").first()
            if item is None:
                dados = {k: v for k, v in f.items() if k != "codigo" or not ItemCAT.objects.filter(codigo=v).exists()}
                dados["ativo"] = False
                item = ItemCAT(**dados)
                item.save()
                self.contagem["perguntas criadas (desactivadas)"] += 1
            mapa[o["pk"]] = item
        return mapa

    def _mapa_cursos(self, por_modelo):
        pre = defaultdict(list)
        for o in por_modelo.get("cursos.prerequisitocurso", []):
            pre[o["fields"]["curso"]].append(o["fields"])
        vet = defaultdict(list)
        for o in por_modelo.get("cursos.vetoridealcurso", []):
            vet[o["fields"]["curso"]].append(o["fields"])
        mapa = {}
        for o in por_modelo.get("cursos.curso", []):
            f = o["fields"]
            curso = Curso.objects.filter(nome__iexact=f["nome"], instituicao__iexact=f["instituicao"]).first()
            if curso is None:
                curso = Curso.objects.create(
                    nome=f["nome"], instituicao=f["instituicao"],
                    arquetipo_dominante=f["arquetipo_dominante"], descricao=f.get("descricao", ""),
                )
                for p in pre[o["pk"]]:
                    PreRequisitoCurso.objects.create(curso=curso, disciplina=p["disciplina"], nota_min=p["nota_min"])
                for v in vet[o["pk"]]:
                    VetorIdealCurso.objects.create(curso=curso, disciplina=v["disciplina"], peso_ideal=v["peso_ideal"])
                self.contagem["cursos criados"] += 1
            mapa[o["pk"]] = curso
        return mapa

    # ---------- juntar ----------

    def _juntar(self, por_modelo, com_demo=False):
        from alunos.management.commands.dados_demo import ESCOLA_DEMO

        itens = self._mapa_itens(por_modelo)
        cursos = self._mapa_cursos(por_modelo)

        notas = defaultdict(list)
        for o in por_modelo.get("alunos.notadisciplina", []):
            notas[o["fields"]["aluno"]].append(o["fields"])
        respostas = defaultdict(list)
        for o in por_modelo.get("cat.respostacat", []):
            respostas[o["fields"]["aluno"]].append(o["fields"])
        recs = defaultdict(list)
        for o in por_modelo.get("recomendacoes.recomendacao", []):
            recs[o["fields"]["aluno"]].append(o["fields"])

        # Só conta como repetido um aluno que JÁ estava neste computador antes de juntar.
        ja_existiam = set(Aluno.objects.values_list("nome", "escola", "idade", "criado_em"))

        for o in por_modelo["alunos.aluno"]:
            f = o["fields"]
            criado_em = _data(f.get("criado_em"))
            if f["escola"] == ESCOLA_DEMO and not com_demo:
                self.contagem["alunos de demonstração deixados de fora"] += 1
                continue
            if (f["nome"], f["escola"], f["idade"], criado_em) in ja_existiam:
                self.contagem["alunos que já existiam (não repetidos)"] += 1
                continue
            aluno = Aluno.objects.create(
                nome=f["nome"], idade=f["idade"], escola=f["escola"], criado_em=criado_em,
                tentativa_cat=f.get("tentativa_cat", 1),
            )
            self.contagem["alunos juntados"] += 1

            for n in notas[o["pk"]]:
                NotaDisciplina.objects.create(aluno=aluno, disciplina=n["disciplina"], nota=n["nota"])
            for r in respostas[o["pk"]]:
                item = itens.get(r["item"])
                if item is None:
                    continue
                nova = RespostaCAT.objects.create(
                    aluno=aluno, item=item, arquetipo_escolhido=r["arquetipo_escolhido"],
                    tentativa=r.get("tentativa", 1), tempo_resposta_ms=r.get("tempo_resposta_ms"),
                    posicao_ecra=r.get("posicao_ecra", ""),
                )
                # respondida_em é preenchida sozinha ao criar: repõe-se a data original.
                RespostaCAT.objects.filter(pk=nova.pk).update(respondida_em=_data(r.get("respondida_em")))
            for rec in recs[o["pk"]]:
                curso = cursos.get(rec["curso"])
                if curso is None:
                    continue
                Recomendacao.objects.create(
                    aluno=aluno, curso=curso, score_academico=rec["score_academico"],
                    score_psicografico=rec["score_psicografico"], score_final=rec["score_final"],
                    rank=rec["rank"], escolhida_pelo_aluno=rec.get("escolhida_pelo_aluno", False),
                    confianca_cat=rec.get("confianca_cat") or {}, alertas_vieses=rec.get("alertas_vieses") or {},
                )

    def _resumo(self, simulacao):
        if not self.contagem:
            self.stdout.write("Nada a juntar.")
            return
        for chave, valor in self.contagem.items():
            self.stdout.write(f"  - {chave}: {valor}")
        if not simulacao:
            self.stdout.write(self.style.SUCCESS(
                "Pronto. Os alunos da cópia foram juntados; os dados que já estavam neste computador ficaram como estavam."
            ))
