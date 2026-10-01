# cat/admin.py

from django.contrib import admin

from .models import ItemCAT, RespostaCAT


@admin.register(ItemCAT)
class ItemCATAdmin(admin.ModelAdmin):
    list_display = ["texto", "tipo", "tendencia"]
    list_filter = ["tipo", "tendencia"]
    search_fields = ["texto"]


@admin.register(RespostaCAT)
class RespostaCATAdmin(admin.ModelAdmin):
    list_display = ["aluno", "item", "arquetipo_escolhido"]
    readonly_fields = ["aluno", "item", "arquetipo_escolhido"]  # gerado pelo aluno a responder, não pelo orientador

    def has_add_permission(self, request):
        return False
