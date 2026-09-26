from django.contrib import admin

# Register your models here.
# cursos/admin.py

from django.contrib import admin
from .models import Curso, PreRequisitoCurso, VetorIdealCurso


class PreRequisitoCursoInline(admin.TabularInline):
    model = PreRequisitoCurso
    extra = 1


class VetorIdealCursoInline(admin.TabularInline):
    model = VetorIdealCurso
    extra = 1


@admin.register(Curso)
class CursoAdmin(admin.ModelAdmin):
    list_display = ["nome", "instituicao", "arquetipo_dominante"]
    list_filter = ["instituicao", "arquetipo_dominante"]
    search_fields = ["nome"]
    inlines = [PreRequisitoCursoInline, VetorIdealCursoInline]