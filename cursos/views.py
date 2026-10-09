# cursos/views.py

from django.db.models import Count, Q
from rest_framework import viewsets

from alunos.sessao import CatalogoOrientador
from .models import Curso, PreRequisitoCurso, VetorIdealCurso
from .serializers import CursoSerializer, PreRequisitoCursoSerializer, VetorIdealCursoSerializer


class CursoViewSet(viewsets.ModelViewSet):
    """
    Catálogo de cursos técnicos. Leitura pública; o orientador adiciona e edita.
    O orientador vê também quantas vezes cada curso foi sugerido, sugerido
    em 1.º lugar e escolhido pelos alunos.
    """
    serializer_class = CursoSerializer
    permission_classes = [CatalogoOrientador]

    def get_queryset(self):
        return Curso.objects.annotate(
            vezes_sugerido=Count("recomendacoes", distinct=True),
            vezes_primeiro=Count("recomendacoes", filter=Q(recomendacoes__rank=1), distinct=True),
            vezes_escolhido=Count(
                "recomendacoes", filter=Q(recomendacoes__escolhida_pelo_aluno=True), distinct=True
            ),
        ).order_by("nome")


class PreRequisitoCursoViewSet(viewsets.ModelViewSet):
    """Regras SE-ENTÃO de cada curso. Leitura pública; o orientador adiciona e edita."""
    queryset = PreRequisitoCurso.objects.all()
    serializer_class = PreRequisitoCursoSerializer
    permission_classes = [CatalogoOrientador]


class VetorIdealCursoViewSet(viewsets.ModelViewSet):
    """Vetores ideais dos cursos. Leitura pública; o orientador adiciona e edita."""
    queryset = VetorIdealCurso.objects.all()
    serializer_class = VetorIdealCursoSerializer
    permission_classes = [CatalogoOrientador]
