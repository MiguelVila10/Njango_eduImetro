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
from .services import SemCursosCompativeis, gerar_recomendacoes


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

        if aluno.recomendacoes.filter(escolhida_pelo_aluno=True).exists():
            return Response(
                {
                    "codigo": "escolha_ja_confirmada",
                    "erro": "Já confirmaste o teu curso. As recomendações não são geradas de novo.",
                },
                status=drf_status.HTTP_409_CONFLICT,
            )

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
        except SemCursosCompativeis as e:
            return Response(
                {
                    "codigo": "sem_cursos_compativeis",
                    "erro": str(e),
                    "cursos_proximos": e.cursos_proximos,
                },
                status=drf_status.HTTP_422_UNPROCESSABLE_ENTITY,
            )
        except ValueError as e:
            return Response({"erro": str(e)}, status=drf_status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(recomendacoes, many=True)
        return Response(serializer.data, status=drf_status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def escolher(self, request, pk=None):
        """
        POST /api/recomendacoes/{id}/escolher/
        Regista o curso escolhido pelo aluno entre as recomendações (RF13).

        A escolha é definitiva: depois de confirmada não se muda. Repetir o
        pedido para a mesma recomendação não dá erro (devolve-a outra vez);
        escolher outra devolve 409.
        """
        recomendacao = self.get_object()  # a permissão já garante que é o próprio aluno
        with transaction.atomic():
            # Bloqueia as linhas do aluno para dois pedidos ao mesmo tempo
            # não deixarem duas escolhas gravadas.
            do_aluno = list(
                Recomendacao.objects.select_for_update().filter(aluno_id=recomendacao.aluno_id)
            )
            ja_escolhida = next((r for r in do_aluno if r.escolhida_pelo_aluno), None)
            if ja_escolhida and ja_escolhida.pk != recomendacao.pk:
                return Response(
                    {
                        "codigo": "escolha_ja_confirmada",
                        "erro": "Já confirmaste a tua escolha. O curso escolhido não pode ser mudado.",
                        "curso_escolhido": ja_escolhida.curso.nome,
                    },
                    status=drf_status.HTTP_409_CONFLICT,
                )
            if not ja_escolhida:
                recomendacao.escolhida_pelo_aluno = True
                recomendacao.save(update_fields=["escolhida_pelo_aluno"])
        return Response(self.get_serializer(recomendacao).data, status=drf_status.HTTP_200_OK)


def _distribuicao_perfis():
    """
    Quantos alunos têm cada perfil dominante (arquétipo mais provável no
    motor bayesiano, tentativa actual). Só conta alunos com respostas.
    """
    from cat import motor

    contagem = {a: 0 for a in motor.ARQUETIPOS}
    alunos = Aluno.objects.filter(respostas_cat__isnull=False).distinct() \
        .prefetch_related("respostas_cat__item")
    for aluno in alunos:
        respostas = [r for r in aluno.respostas_cat.all() if r.tentativa == aluno.tentativa_cat]
        if not respostas:
            continue
        crenca = motor.calcular_crenca((r.item.tendencia, r.arquetipo_escolhido) for r in respostas)
        contagem[motor.arquetipo_provavel(crenca)] += 1
    return contagem


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
        total_alunos = Aluno.objects.count()
        com_recomendacoes = Recomendacao.objects.values("aluno").distinct().count()
        return Response({
            "total_alunos": total_alunos,
            "testes_por_terminar": total_alunos - com_recomendacoes,
            "distribuicao_perfis": _distribuicao_perfis(),
            "alunos_com_respostas_cat": RespostaCAT.objects.values("aluno").distinct().count(),
            "alunos_com_recomendacoes": com_recomendacoes,
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
