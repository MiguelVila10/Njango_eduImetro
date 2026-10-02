# cat/admin.py

from django.contrib import admin

from .models import ItemCAT, RespostaCAT


@admin.register(ItemCAT)
class ItemCATAdmin(admin.ModelAdmin):
    list_display = ["posicao", "codigo", "texto", "tendencia", "contexto", "tipo", "par_coerencia", "ativo"]
    list_display_links = ["codigo", "texto"]
    list_filter = ["ativo", "tendencia", "contexto", "tipo"]
    search_fields = ["codigo", "texto"]


@admin.register(RespostaCAT)
class RespostaCATAdmin(admin.ModelAdmin):
    list_display = ["aluno", "item", "arquetipo_escolhido"]
    readonly_fields = ["aluno", "item", "arquetipo_escolhido"]  # gerado pelo aluno a responder, não pelo orientador

    def has_add_permission(self, request):
        return False
