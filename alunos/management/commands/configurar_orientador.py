# alunos/management/commands/configurar_orientador.py
"""
Cria (ou actualiza) o grupo "Orientador" com as permissões da regra de negócio
e, opcionalmente, uma conta de orientador.

Regra de negócio:
- o orientador CONSULTA alunos, notas, respostas do CAT e recomendações
  (nunca as altera);
- o orientador ADICIONA e EDITA cursos, pré-requisitos, vetores ideais e
  perguntas do CAT (não apaga: nas perguntas usa o campo "ativo").

Uso:
    python manage.py configurar_orientador
    python manage.py configurar_orientador --username prof.ana
"""

import getpass

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.core.management.base import BaseCommand, CommandError

NOME_GRUPO = "Orientador"

SO_CONSULTA = [
    ("alunos", "aluno"),
    ("alunos", "notadisciplina"),
    ("cat", "respostacat"),
    ("recomendacoes", "recomendacao"),
]

CATALOGO = [
    ("cursos", "curso"),
    ("cursos", "prerequisitocurso"),
    ("cursos", "vetoridealcurso"),
    ("cat", "itemcat"),
]


def configurar_grupo():
    grupo, _ = Group.objects.get_or_create(name=NOME_GRUPO)
    codenames = []
    for app, modelo in SO_CONSULTA:
        codenames.append((app, f"view_{modelo}"))
    for app, modelo in CATALOGO:
        codenames += [(app, f"view_{modelo}"), (app, f"add_{modelo}"), (app, f"change_{modelo}")]

    permissoes = []
    for app, codename in codenames:
        try:
            permissoes.append(Permission.objects.get(content_type__app_label=app, codename=codename))
        except Permission.DoesNotExist:
            raise CommandError(f"Permissão {app}.{codename} não existe. Corre primeiro: python manage.py migrate")
    grupo.permissions.set(permissoes)
    return grupo


class Command(BaseCommand):
    help = "Cria o grupo Orientador (consulta alunos; gere cursos e perguntas) e, opcionalmente, uma conta."

    def add_arguments(self, parser):
        parser.add_argument("--username", help="Cria ou actualiza esta conta de orientador.")
        parser.add_argument("--password", help="Só para testes/automação; sem isto, a palavra-passe é pedida.")

    def handle(self, *args, **opts):
        grupo = configurar_grupo()
        self.stdout.write(self.style.SUCCESS(
            f'Grupo "{NOME_GRUPO}" configurado com {grupo.permissions.count()} permissões.'
        ))

        username = opts.get("username")
        if not username:
            return

        User = get_user_model()
        user, criado = User.objects.get_or_create(username=username)
        user.is_staff = True        # pode entrar no Admin e usar a API como orientador
        user.is_superuser = False   # nunca superutilizador: as permissões vêm do grupo
        if criado:
            senha = opts.get("password") or getpass.getpass("Palavra-passe do orientador: ")
            if not senha:
                raise CommandError("A palavra-passe não pode ficar vazia.")
            user.set_password(senha)
        user.save()
        user.groups.add(grupo)
        acao = "criada" if criado else "actualizada"
        self.stdout.write(self.style.SUCCESS(f'Conta de orientador "{username}" {acao}.'))
