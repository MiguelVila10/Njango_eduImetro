from django.contrib import admin

# Register your models here.
# alunos/admin.py
from django.contrib import admin
from .models import Aluno, NotaDisciplina


class NotaDisciplinaInline(admin.TabularInline):
    model = NotaDisciplina
    extra = 1


@admin.register(Aluno)
class AlunoAdmin(admin.ModelAdmin):
    list_display = ["nome", "idade", "escola", "criado_em", "tentativa_cat"]
    readonly_fields = ["criado_em", "tentativa_cat"]
    search_fields = ["nome"]
    inlines = [NotaDisciplinaInline]