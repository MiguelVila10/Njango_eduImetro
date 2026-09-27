# recomendacoes/views.py

from rest_framework import viewsets, status as drf_status
from rest_framework.decorators import action
from rest_framework.response import Response

from alunos.models import Aluno
from .models import Recomendacao
from .serializers import RecomendacaoSerializer
from .services import gerar_recomendacoes


class RecomendacaoViewSet(viewsets.ModelViewSet):
    """Endpoint CRUD para recomendações de curso (RF10, RF13)."""
    queryset = Recomendacao.objects.all()
    serializer_class = RecomendacaoSerializer

    @action(detail=False, methods=["post"], url_path="gerar/(?P<aluno_id>[^/.]+)")
    def gerar(self, request, aluno_id=None):
        """
        POST /api/recomendacoes/gerar/{aluno_id}/
        Corre o motor de inferência completo (RF07-RF10) para o aluno
        indicado e devolve as 3 recomendações geradas.
        """
        try:
            aluno = Aluno.objects.get(pk=aluno_id)
        except Aluno.DoesNotExist:
            return Response({"erro": "Aluno não encontrado."}, status=drf_status.HTTP_404_NOT_FOUND)

        try:
            recomendacoes = gerar_recomendacoes(aluno)
        except ValueError as e:
            return Response({"erro": str(e)}, status=drf_status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(recomendacoes, many=True)
        return Response(serializer.data, status=drf_status.HTTP_200_OK)