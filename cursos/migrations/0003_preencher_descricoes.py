# Preenche Curso.descricao dos 20 cursos quando ainda está vazia.
# Não substitui textos que o orientador já tenha escrito no Admin.

from django.db import migrations


def preencher(apps, schema_editor):
    from cursos.descricoes import DESCRICOES

    Curso = apps.get_model("cursos", "Curso")
    for (nome, instituicao), texto in DESCRICOES.items():
        Curso.objects.filter(nome=nome, instituicao=instituicao, descricao="").update(descricao=texto)


class Migration(migrations.Migration):
    dependencies = [("cursos", "0002_curso_descricao")]
    operations = [migrations.RunPython(preencher, migrations.RunPython.noop)]
