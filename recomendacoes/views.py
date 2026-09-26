from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import Recomendacao
from .serializers import RecomendacaoSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status as drf_status

from alunos.models import Aluno
from .services import gerar_recomendacoes

class RecomendacaoViewSet(viewsets.ModelViewSet):
    queryset = Recomendacao.objects.all()
    serializer_class = RecomendacaoSerializer

    @action(detail=False, methods=["post"], url_path="gerar/(?P<aluno_id>[^/.]+)")
    def gerar(self, request, aluno_id=None):
        """
        POST /api/recomendacoes/gerar/{aluno_id}/
        Corre o motor de inferência completo (RF07-RF10) para o aluno
        indicado e devolve as recomendações geradas.
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