# cursos/views.py

from rest_framework import viewsets

from alunos.sessao import LeituraPublicaEscritaOrientador
from .models import Curso, PreRequisitoCurso, VetorIdealCurso
from .serializers import CursoSerializer, PreRequisitoCursoSerializer, VetorIdealCursoSerializer


class CursoViewSet(viewsets.ModelViewSet):
    """Catálogo de cursos técnicos. Leitura pública; só o orientador altera."""
    queryset = Curso.objects.all()
    serializer_class = CursoSerializer
    permission_classes = [LeituraPublicaEscritaOrientador]


class PreRequisitoCursoViewSet(viewsets.ModelViewSet):
    """Regras SE-ENTÃO de cada curso. Leitura pública; só o orientador altera."""
    queryset = PreRequisitoCurso.objects.all()
    serializer_class = PreRequisitoCursoSerializer
    permission_classes = [LeituraPublicaEscritaOrientador]


class VetorIdealCursoViewSet(viewsets.ModelViewSet):
    """Vetores ideais dos cursos. Leitura pública; só o orientador altera."""
    queryset = VetorIdealCurso.objects.all()
    serializer_class = VetorIdealCursoSerializer
    permission_classes = [LeituraPublicaEscritaOrientador]
