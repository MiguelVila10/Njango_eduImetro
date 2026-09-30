# alunos/views.py

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status as drf_status

from .models import Aluno, NotaDisciplina
from .serializers import AlunoSerializer, NotaDisciplinaSerializer


DISCIPLINAS_OBRIGATORIAS = [
    "Português", "Matemática", "Física", "Química", "Biologia",
    "História", "Geografia", "Língua Estrangeira", "Educação Moral e Cívica",
    "Educação Física", "Educação Visual", "Educação Laboral",
]


class AlunoViewSet(viewsets.ModelViewSet):
    """Endpoint CRUD para o registo e gestão do perfil básico do aluno (RF01)."""
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

    @action(detail=False, methods=["get"], url_path="entrar")
    def entrar(self, request):
        """
        GET /api/alunos/entrar/?codigo=A1B2C3
        Recupera o perfil do aluno a partir do código de acesso.
        """
        codigo = request.query_params.get("codigo", "").upper()
        try:
            aluno = Aluno.objects.get(codigo_acesso=codigo)
        except Aluno.DoesNotExist:
            return Response({"erro": "Código inválido."}, status=drf_status.HTTP_404_NOT_FOUND)

        return Response(self.get_serializer(aluno).data)


class NotaDisciplinaViewSet(viewsets.ModelViewSet):
    """Endpoint CRUD para notas por disciplina (RF02, RF03)."""
    queryset = NotaDisciplina.objects.all()
    serializer_class = NotaDisciplinaSerializer