from rest_framework import viewsets
from .models import Curso, PreRequisitoCurso, VetorIdealCurso
from .serializers import CursoSerializer, PreRequisitoCursoSerializer, VetorIdealCursoSerializer


class CursoViewSet(viewsets.ModelViewSet):
    queryset = Curso.objects.all()
    serializer_class = CursoSerializer


class PreRequisitoCursoViewSet(viewsets.ModelViewSet):
    queryset = PreRequisitoCurso.objects.all()
    serializer_class = PreRequisitoCursoSerializer


class VetorIdealCursoViewSet(viewsets.ModelViewSet):
    queryset = VetorIdealCurso.objects.all()
    serializer_class = VetorIdealCursoSerializer