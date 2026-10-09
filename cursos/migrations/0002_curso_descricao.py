from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("cursos", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="curso",
            name="descricao",
            field=models.TextField(
                blank=True,
                default="",
                help_text="Explicação simples do curso para o aluno (o que se aprende, onde se trabalha).",
            ),
        ),
    ]
