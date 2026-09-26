from django.contrib import admin

# Register your models here.
# recomendacoes/admin.py

from django.contrib import admin
from .models import Recomendacao


@admin.register(Recomendacao)
class RecomendacaoAdmin(admin.ModelAdmin):
    list_display = ["aluno", "curso", "score_final", "rank", "escolhida_pelo_aluno"]
    list_filter = ["rank", "escolhida_pelo_aluno"]
    readonly_fields = [f.name for f in Recomendacao._meta.fields]  # tudo só-leitura

    def has_add_permission(self, request):
        return False  # não se cria uma Recomendacao à mão, só via gerar_recomendacoes()

    def has_delete_permission(self, request, obj=None):
        return True  # pode fazer sentido apagar para limpar dados de teste