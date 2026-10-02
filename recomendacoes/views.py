# recomendacoes/views.py

from django.db import transaction
from django.db.models import Count
from rest_framework import status as drf_status
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView

from alunos.models import Aluno
from alunos.sessao import (
    EhOrientador,
    OrientadorLeAlunoEscreve,
    eh_o_proprio_aluno,
    filtrar_pelo_aluno,
)
from cat.models import RespostaCAT
from cat.services import estado_cat
from .models import Recomendacao
from .serializers import RecomendacaoSerializer
from .services import gerar_recomendacoes


class SoPeloMotor(BasePermission):
    message = "As recomendações são geradas pelo motor de inferência e não se editam à mão (RF11)."

    def has_permission(self, request, view):
        return False


class RecomendacaoViewSet(viewsets.ModelViewSet):
    """
    Recomendações de curso (RF10, RF11, RF13).

    - Leitura: o aluno vê as suas; o orientador vê todas (só consulta).
    - Gerar e escolher: só o próprio aluno (com sessão).
    - Criar/alterar/apagar à mão: ninguém pela API (as recomendações são
      geradas pelo motor e não se editam — RF11).
    """
    serializer_class = RecomendacaoSerializer

    def get_queryset(self):
        return filtrar_pelo_aluno(
            self.request, Recomendacao.objects.select_related("curso")
        )

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [SoPeloMotor()]
        return [OrientadorLeAlunoEscreve()]

    @action(detail=False, methods=["post"], url_path="gerar/(?P<aluno_id>[^/.]+)")
    def gerar(self, request, aluno_id=None):
        """
        POST /api/recomendacoes/gerar/{aluno_id}/
        Corre o motor de inferência completo (RF07-RF10) para o aluno e
        devolve até 3 recomendações. Exige que o CAT já tenha terminado.
        """
        if not str(aluno_id).isdigit() or not eh_o_proprio_aluno(request, aluno_id):
            return Response({"erro": "Só o próprio aluno pode gerar as suas recomendações."},
                            status=drf_status.HTTP_403_FORBIDDEN)
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
            recomendacoes = gerar_recomendacoes(aluno, confianca=estado["confianca"])
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


class PainelResumoView(APIView):
    """
    GET /api/painel/resumo/
    Números para o painel do orientador (só consulta).
    """
    permission_classes = [EhOrientador]

    def get(self, request):
        primeiras = (
            Recomendacao.objects.filter(rank=1)
            .values("curso__nome", "curso__instituicao")
            .annotate(alunos=Count("aluno", distinct=True))
            .order_by("-alunos", "curso__nome")
        )
        escolhidos = (
            Recomendacao.objects.filter(escolhida_pelo_aluno=True)
            .values("curso__nome", "curso__instituicao")
            .annotate(alunos=Count("aluno", distinct=True))
            .order_by("-alunos", "curso__nome")
        )
        com_alertas = (
            Recomendacao.objects.filter(rank=1)
            .exclude(alertas_vieses__sobrestimacao=[], alertas_vieses__subestimacao=[])
            .values("aluno").distinct().count()
        )
        return Response({
            "total_alunos": Aluno.objects.count(),
            "alunos_com_respostas_cat": RespostaCAT.objects.values("aluno").distinct().count(),
            "alunos_com_recomendacoes": Recomendacao.objects.values("aluno").distinct().count(),
            "alunos_que_escolheram_curso": Recomendacao.objects.filter(escolhida_pelo_aluno=True)
                                           .values("aluno").distinct().count(),
            "alunos_com_alertas_de_vies": com_alertas,
            "cursos_mais_recomendados": [
                {"curso": c["curso__nome"], "instituicao": c["curso__instituicao"], "alunos": c["alunos"]}
                for c in primeiras
            ],
            "cursos_mais_escolhidos": [
                {"curso": c["curso__nome"], "instituicao": c["curso__instituicao"], "alunos": c["alunos"]}
                for c in escolhidos
            ],
        })
