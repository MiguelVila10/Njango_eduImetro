from django.contrib import admin

# Register your models here.
# alunos/admin.py
from django.contrib import admin
from .models import Aluno, NotaDisciplina, PerfilOrientador
from .orientadores import aprovar_conta_orientador


class NotaDisciplinaInline(admin.TabularInline):
    model = NotaDisciplina
    extra = 1


@admin.register(Aluno)
class AlunoAdmin(admin.ModelAdmin):
    list_display = ["nome", "idade", "escola", "criado_em", "tentativa_cat"]
    readonly_fields = ["criado_em", "tentativa_cat"]
    search_fields = ["nome"]
    inlines = [NotaDisciplinaInline]

@admin.register(PerfilOrientador)
class PerfilOrientadorAdmin(admin.ModelAdmin):
    """Pedidos de conta de orientador: aprovar com a acção 'Aprovar contas seleccionadas'."""

    list_display = ["__str__", "email", "criado_em", "aprovado_em"]
    list_filter = [("aprovado_em", admin.EmptyFieldListFilter)]
    readonly_fields = ["criado_em", "aprovado_em"]
    actions = ["aprovar"]

    @admin.display(description="E-mail")
    def email(self, obj):
        return obj.user.email

    @admin.action(description="Aprovar contas seleccionadas")
    def aprovar(self, request, queryset):
        for perfil in queryset.select_related("user"):
            aprovar_conta_orientador(perfil.user)
        self.message_user(request, f"{queryset.count()} conta(s) aprovada(s).")
