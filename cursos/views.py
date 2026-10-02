# cursos/views.py

from rest_framework import viewsets

from alunos.sessao import CatalogoOrientador
from .models import Curso, PreRequisitoCurso, VetorIdealCurso
from .serializers import CursoSerializer, PreRequisitoCursoSerializer, VetorIdealCursoSerializer


class CursoViewSet(viewsets.ModelViewSet):
    """Catálogo de cursos técnicos. Leitura pública; o orientador adiciona e edita."""
    queryset = Curso.objects.all()
    serializer_class = CursoSerializer
    permission_classes = [CatalogoOrientador]


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
