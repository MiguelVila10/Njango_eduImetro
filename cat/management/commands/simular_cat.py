# cat/management/commands/simular_cat.py
"""
Simulação do CAT adaptativo com alunos sintéticos (prova de viabilidade).

Cada aluno sintético tem um arquétipo "verdadeiro" conhecido e responde às
perguntas do banco actual segundo as probabilidades da calibração. Com
--ruido, uma fracção das respostas é dada ao acaso (aluno distraído ou
pouco sincero). Compara-se o CAT adaptativo com um questionário fixo que
aplica todas as perguntas do banco.

Uso:
    python manage.py simular_cat
    python manage.py simular_cat --alunos 2000 --ruido 0.2 --seed 7

Nota metodológica: os alunos sintéticos seguem o mesmo modelo de calibração
usado pelo CAT, por isso a simulação demonstra a viabilidade e a eficiência
do mecanismo adaptativo, não a validade psicométrica das perguntas (que
exige aplicação a alunos reais).
"""

import random
from collections import Counter

from django.core.management.base import BaseCommand, CommandError

from cat import motor
from cat.models import ItemCAT


def _responder(rng, tendencia, arquetipo_real, ruido):
    if rng.random() < ruido:
        return rng.choice(motor.ARQUETIPOS)
    matriz = motor.matriz_probabilidades(tendencia)
    pesos = [matriz[opcao][arquetipo_real] for opcao in motor.ARQUETIPOS]
    return rng.choices(motor.ARQUETIPOS, weights=pesos, k=1)[0]


def simular_aluno_adaptativo(rng, banco, arquetipo_real, ruido):
    """banco: lista de (item_id, tendencia). Devolve (arquetipo_estimado, n_perguntas, motivo)."""
    tendencias = dict(banco)
    crenca = motor.crenca_inicial()
    respondidos = set()
    while True:
        candidatos = [(i, t) for i, t in banco if i not in respondidos]
        motivo = motor.decidir_paragem(crenca, len(respondidos), len(candidatos))
        if motivo:
            return motor.arquetipo_provavel(crenca), len(respondidos), motivo
        item_id = motor.escolher_item(crenca, candidatos, rng=rng)
        escolha = _responder(rng, tendencias[item_id], arquetipo_real, ruido)
        crenca = motor.atualizar_crenca(crenca, tendencias[item_id], escolha)
        respondidos.add(item_id)


def simular_aluno_fixo(rng, banco, arquetipo_real, ruido):
    """Questionário fixo: aplica todas as perguntas do banco, sem paragem antecipada."""
    crenca = motor.crenca_inicial()
    for _, tendencia in banco:
        escolha = _responder(rng, tendencia, arquetipo_real, ruido)
        crenca = motor.atualizar_crenca(crenca, tendencia, escolha)
    return motor.arquetipo_provavel(crenca)


def simular(banco, n_alunos, ruido, seed):
    rng = random.Random(seed)
    acertos_cat = acertos_fixo = 0
    total_perguntas = 0
    motivos = Counter()
    por_arquetipo = {a: [0, 0] for a in motor.ARQUETIPOS}  # [acertos, total]
    for _ in range(n_alunos):
        real = rng.choice(motor.ARQUETIPOS)
        estimado, n, motivo = simular_aluno_adaptativo(rng, banco, real, ruido)
        acertos_cat += estimado == real
        total_perguntas += n
        motivos[motivo] += 1
        por_arquetipo[real][0] += estimado == real
        por_arquetipo[real][1] += 1
        acertos_fixo += simular_aluno_fixo(rng, banco, real, ruido) == real
    return {
        "alunos": n_alunos,
        "precisao_cat": acertos_cat / n_alunos,
        "media_perguntas": total_perguntas / n_alunos,
        "precisao_fixo": acertos_fixo / n_alunos,
        "perguntas_fixo": len(banco),
        "motivos": dict(motivos),
        "por_arquetipo": {a: (v[0] / v[1] if v[1] else 0.0) for a, v in por_arquetipo.items()},
    }


class Command(BaseCommand):
    help = "Simula o CAT adaptativo com alunos sintéticos e compara com um questionário fixo."

    def add_arguments(self, parser):
        parser.add_argument("--alunos", type=int, default=1000)
        parser.add_argument("--ruido", type=float, default=0.0,
                            help="Fracção de respostas dadas ao acaso (0 a 1).")
        parser.add_argument("--seed", type=int, default=42)

    def handle(self, *args, **opts):
        banco = list(ItemCAT.objects.filter(ativo=True).exclude(tipo="verificacao").values_list("id", "tendencia"))
        if not banco:
            raise CommandError("O banco de itens está vazio. Corre primeiro: python manage.py seed_itens_cat")
        if not 0 <= opts["ruido"] <= 1:
            raise CommandError("--ruido deve estar entre 0 e 1.")

        r = simular(banco, opts["alunos"], opts["ruido"], opts["seed"])

        contagem = Counter(t for _, t in banco)
        self.stdout.write(f"\nBanco: {len(banco)} perguntas | tendências: {dict(contagem)}")
        self.stdout.write(f"Alunos sintéticos: {r['alunos']} | ruído: {opts['ruido']:.0%} | seed: {opts['seed']}")
        self.stdout.write(f"Regras: certeza {motor.CERTEZA_ALVO:.0%}, mínimo {motor.MIN_PERGUNTAS}, máximo {motor.MAX_PERGUNTAS}\n")
        self.stdout.write(f"{'':28}{'CAT adaptativo':>16}{'Questionário fixo':>20}")
        self.stdout.write(f"{'Precisão (arquétipo certo)':28}{r['precisao_cat']:>16.1%}{r['precisao_fixo']:>20.1%}")
        self.stdout.write(f"{'Perguntas por aluno':28}{r['media_perguntas']:>16.1f}{r['perguntas_fixo']:>20}")
        poupanca = 1 - r["media_perguntas"] / r["perguntas_fixo"]
        self.stdout.write(f"{'Redução de perguntas':28}{poupanca:>16.0%}")
        self.stdout.write("\nPrecisão do CAT por arquétipo:")
        for a, p in r["por_arquetipo"].items():
            self.stdout.write(f"  {a:14} {p:.1%}")
        self.stdout.write(f"\nMotivos de paragem: {r['motivos']}\n")
