# recomendacoes/views.py

from django.db import transaction
from rest_framework import status as drf_status
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from alunos.models import Aluno
from alunos.sessao import (
    EhOrientador,
    OrientadorOuSessaoDoAluno,
    filtrar_pelo_aluno,
    pode_aceder_aluno,
)
from cat.services import estado_cat
from .models import Recomendacao
from .serializers import RecomendacaoSerializer
from .services import gerar_recomendacoes


class RecomendacaoViewSet(viewsets.ModelViewSet):
    """
    Recomendações de curso (RF10, RF11, RF13).

    - Leitura: o aluno vê as suas; o orientador vê todas.
    - Gerar e escolher: o próprio aluno (com sessão) ou o orientador.
    - Criar/alterar/apagar à mão: só o orientador (as recomendações são
      geradas pelo motor; não devem ser editadas — RF11).
    """
    serializer_class = RecomendacaoSerializer

    def get_queryset(self):
        return filtrar_pelo_aluno(
            self.request, Recomendacao.objects.select_related("curso")
        )

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [EhOrientador()]
        return [OrientadorOuSessaoDoAluno()]

    @action(detail=False, methods=["post"], url_path="gerar/(?P<aluno_id>[^/.]+)")
    def gerar(self, request, aluno_id=None):
        """
        POST /api/recomendacoes/gerar/{aluno_id}/
        Corre o motor de inferência completo (RF07-RF10) para o aluno e
        devolve até 3 recomendações. Exige que o CAT já tenha terminado.
        """
        if not str(aluno_id).isdigit() or not pode_aceder_aluno(request, aluno_id):
            return Response({"erro": "Sem acesso aos dados deste aluno."}, status=drf_status.HTTP_403_FORBIDDEN)
        try:
            aluno = Aluno.objects.get(pk=aluno_id)
        except Aluno.DoesNotExist:
            return Response({"erro": "Aluno não encontrado."}, status=drf_status.HTTP_404_NOT_FOUND)

        estado = estado_cat(aluno)
        if not estado["terminado"]:
            return Response(
                {
                    "erro": "O questionário CAT ainda não terminou.",
                    "respondidas": estado["respondidas"],
                },
                status=drf_status.HTTP_400_BAD_REQUEST,
            )

        try:
            recomendacoes = gerar_recomendacoes(aluno)
        except ValueError as e:
            return Response({"erro": str(e)}, status=drf_status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(recomendacoes, many=True)
        return Response(serializer.data, status=drf_status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def escolher(self, request, pk=None):
        """
        POST /api/recomendacoes/{id}/escolher/
        Regista o curso escolhido pelo aluno entre as recomendações (RF13).
        Só uma recomendação por aluno fica marcada como escolhida.
        """
        recomendacao = self.get_object()
        with transaction.atomic():
            Recomendacao.objects.filter(aluno=recomendacao.aluno).update(escolhida_pelo_aluno=False)
            recomendacao.escolhida_pelo_aluno = True
            recomendacao.save(update_fields=["escolhida_pelo_aluno"])
        return Response(self.get_serializer(recomendacao).data, status=drf_status.HTTP_200_OK)
