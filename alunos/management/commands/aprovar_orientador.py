# alunos/management/commands/aprovar_orientador.py
"""
Lista os pedidos de conta de orientador e aprova-os.

Uso:
    python manage.py aprovar_orientador                 # lista os pedidos pendentes
    python manage.py aprovar_orientador --email a@b.ao  # aprova esse pedido
"""

from django.core.management.base import BaseCommand, CommandError

from alunos.models import PerfilOrientador
from alunos.orientadores import aprovar_conta_orientador


class Command(BaseCommand):
    help = "Lista e aprova pedidos de conta de orientador feitos na página 'Criar conta'."

    def add_arguments(self, parser):
        parser.add_argument("--email", help="E-mail do pedido a aprovar.")

    def handle(self, *args, **opts):
        email = (opts.get("email") or "").strip().lower()
        if not email:
            pendentes = PerfilOrientador.objects.filter(aprovado_em__isnull=True).select_related("user")
            if not pendentes:
                self.stdout.write("Não há pedidos de conta pendentes.")
                return
            self.stdout.write("Pedidos pendentes:")
            for p in pendentes:
                self.stdout.write(f"  - {p.user.email}  ·  {p.user.get_full_name()}  ·  {p.escola}  ·  {p.criado_em:%d/%m/%Y %H:%M}")
            self.stdout.write("\nPara aprovar: python manage.py aprovar_orientador --email EMAIL")
            return

        perfil = PerfilOrientador.objects.select_related("user").filter(user__email__iexact=email).first()
        if perfil is None:
            raise CommandError(f"Não existe nenhum pedido de conta com o e-mail {email}.")
        aprovar_conta_orientador(perfil.user)
        self.stdout.write(self.style.SUCCESS(f"Conta de {perfil.user.get_full_name()} ({email}) aprovada. Já pode entrar."))
