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
    python manage.py configurar_orientador --username prof.ana
    python manage.py configurar_orientador --username prof.ana --nova-senha
    python manage.py configurar_orientador --username prof.ana --email ana@escola.ao
    python manage.py configurar_orientador --username prof.ana --administrador

Ao escrever a palavra-passe, o terminal não mostra nada (nem asteriscos):
é normal. Pede-se duas vezes para evitar erros de escrita.
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
        parser.add_argument("--email", help="E-mail da conta (para entrar com o e-mail na página do orientador).")
        parser.add_argument(
            "--administrador", action="store_true",
            help="Dá a esta conta o papel de administrador: aprova os pedidos de conta de novos orientadores.",
        )
        parser.add_argument("--password", help="Só para testes/automação; sem isto, a palavra-passe é pedida.")
        parser.add_argument(
            "--nova-senha", action="store_true",
            help="Muda a palavra-passe de uma conta que já existe.",
        )

    def _pedir_senha(self, opts):
        if opts.get("password"):
            return opts["password"]
        self.stdout.write("Ao escrever a palavra-passe não aparece nada no ecrã. É normal: escreve e carrega Enter.")
        senha = getpass.getpass("Palavra-passe do orientador: ")
        if not senha:
            raise CommandError("A palavra-passe não pode ficar vazia.")
        if len(senha) < 8:
            raise CommandError("A palavra-passe precisa de pelo menos 8 caracteres.")
        if getpass.getpass("Escreve outra vez a palavra-passe: ") != senha:
            raise CommandError("As duas palavras-passe não são iguais. Nada foi alterado; tenta de novo.")
        return senha

    def handle(self, *args, **opts):
        grupo = configurar_grupo()
        self.stdout.write(self.style.SUCCESS(
            f'Grupo "{NOME_GRUPO}" configurado com {grupo.permissions.count()} permissões.'
        ))

        username = (opts.get("username") or "").strip()
        if not username:
            self.stdout.write(
                "Nenhuma conta criada. Para criar um orientador: "
                "python manage.py configurar_orientador --username NOME"
            )
            return

        User = get_user_model()
        user = User.objects.filter(username=username).first()
        criado = user is None
        mudar_senha = criado or opts.get("nova_senha")
        # A palavra-passe pede-se antes de gravar: se falhar, nada fica a meio.
        senha = self._pedir_senha(opts) if mudar_senha else None

        if criado:
            user = User(username=username)
        user.is_staff = True        # pode entrar no Admin e usar a API como orientador
        user.is_superuser = False   # nunca superutilizador: as permissões vêm do grupo
        user.is_active = True
        if senha:
            user.set_password(senha)
        if opts.get("email"):
            user.email = opts["email"].strip().lower()
        user.save()
        user.groups.add(grupo)
        if opts.get("administrador"):
            perms = Permission.objects.filter(
                content_type__app_label="alunos", codename__in=["view_perfilorientador", "change_perfilorientador"]
            )
            user.user_permissions.add(*perms)
            self.stdout.write(self.style.SUCCESS(f'"{username}" é agora administrador: pode aprovar pedidos de conta.'))

        if criado:
            self.stdout.write(self.style.SUCCESS(f'Conta de orientador "{username}" criada. Já pode entrar.'))
        elif senha:
            self.stdout.write(self.style.SUCCESS(f'Conta "{username}" actualizada, com a nova palavra-passe.'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Conta "{username}" já existia e foi actualizada.'))
            self.stdout.write(
                "A palavra-passe ficou igual. Para a mudar: "
                f"python manage.py configurar_orientador --username {username} --nova-senha"
            )
