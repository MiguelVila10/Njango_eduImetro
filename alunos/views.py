# alunos/views.py

from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.response import Response

from .models import Aluno, NotaDisciplina
from .serializers import AlunoSerializer, NotaDisciplinaSerializer
from .sessao import (
    EhOrientador,
    OrientadorLeAlunoEscreve,
    exigir_acesso_ao_aluno,
    filtrar_pelo_aluno,
    gerar_token_sessao,
)


DISCIPLINAS_OBRIGATORIAS = [
    "Português", "Matemática", "Física", "Química", "Biologia",
    "História", "Geografia", "Língua Estrangeira", "Educação Moral e Cívica",
    "Educação Física", "Educação Visual", "Educação Laboral",
]


class NinguemPelaAPI(BasePermission):
    message = "Os registos dos alunos não se apagam pela API."

    def has_permission(self, request, view):
        return False


class AlunoViewSet(viewsets.ModelViewSet):
    """
    Registo do perfil básico do aluno (RF01).

    - POST (público): o aluno inicia o teste e recebe o token de sessão.
    - GET do registo: o próprio aluno ou o orientador; PATCH: só o aluno.
    - Lista de todos os alunos: só o orientador (consulta).
    - Eliminar: ninguém pela API.
    """
    serializer_class = AlunoSerializer

    def get_queryset(self):
        return filtrar_pelo_aluno(self.request, Aluno.objects.all(), campo="pk")

    def get_permissions(self):
        if self.action == "create":
            return [AllowAny()]
        if self.action == "list":
            return [EhOrientador()]
        if self.action == "destroy":
            return [NinguemPelaAPI()]
        return [OrientadorLeAlunoEscreve()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        aluno = serializer.save()
        dados = dict(serializer.data)
        dados["token_sessao"] = gerar_token_sessao(aluno)
        return Response(dados, status=status.HTTP_201_CREATED)

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


class NotaDisciplinaViewSet(viewsets.ModelViewSet):
    """Notas por disciplina (RF02, RF03). O aluno gere as suas; o orientador só consulta."""
    serializer_class = NotaDisciplinaSerializer
    permission_classes = [OrientadorLeAlunoEscreve]

    def get_queryset(self):
        return filtrar_pelo_aluno(self.request, NotaDisciplina.objects.all())

    def perform_create(self, serializer):
        exigir_acesso_ao_aluno(self.request, serializer.validated_data["aluno"])
        serializer.save()

    def perform_update(self, serializer):
        aluno = serializer.validated_data.get("aluno", serializer.instance.aluno)
        exigir_acesso_ao_aluno(self.request, aluno)
        serializer.save()
