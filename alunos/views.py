from django.shortcuts import render

# Create your views here.
# alunos/views.py

from rest_framework import viewsets
from .models import Aluno
from .serializers import AlunoSerializer
from .models import NotaDisciplina
from .serializers import NotaDisciplinaSerializer
from rest_framework.decorators import action
from rest_framework.response import Response

cDISCIPLINAS_OBRIGATORIAS = [
    "Português", "Matemática", "Física", "Química", "Biologia",
    "História", "Geografia", "Língua Estrangeira", "Educação Moral e Cívica",
    "Educação Física", "Educação Visual", "Educação Laboral",
]


DISCIPLINAS_OBRIGATORIAS = [
    "Português", "Matemática", "Física", "Química", "Biologia",
    "História", "Geografia", "Língua Estrangeira", "Educação Moral e Cívica",
    "Educação Física", "Educação Visual", "Educação Laboral",
]


class AlunoViewSet(viewsets.ModelViewSet):
    queryset = Aluno.objects.all()
    serializer_class = AlunoSerializer

    @action(detail=True, methods=["get"], url_path="boletim-completo")
    def boletim_completo(self, request, pk=None):
        """
        GET /api/alunos/{id}/boletim-completo/
        Indica se o aluno já submeteu as 12 notas obrigatórias (RF02).
        """
        aluno = self.get_object()
        disciplinas_registadas = set(aluno.notas.values_list("disciplina", flat=True))
        faltam = [d for d in DISCIPLINAS_OBRIGATORIAS if d not in disciplinas_registadas]

        return Response({
            "completo": len(faltam) == 0,
            "faltam": faltam,
        })