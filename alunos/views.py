from django.shortcuts import render

# Create your views here.
# alunos/views.py

from rest_framework import viewsets
from .models import Aluno
from .serializers import AlunoSerializer
from .models import NotaDisciplina
from .serializers import NotaDisciplinaSerializer

class AlunoViewSet(viewsets.ModelViewSet):
    """
    Endpoint CRUD para o registo e gestão do perfil básico do aluno (RF01).

    RNF05 (privacidade): não expõe nenhum campo além dos definidos no
    AlunoSerializer — não há dados sensíveis adicionais expostos aqui.
    """
    queryset = Aluno.objects.all()
    serializer_class = AlunoSerializer




class NotaDisciplinaViewSet(viewsets.ModelViewSet):
    """Endpoint CRUD para notas por disciplina (RF02, RF03)."""
    queryset = NotaDisciplina.objects.all()
    serializer_class = NotaDisciplinaSerializer