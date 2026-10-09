# cat/views.py

from django.db.models import Count, Q
from rest_framework import status, viewsets
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView

from alunos.models import Aluno
from alunos.sessao import (
    OrientadorLeAlunoEscreve,
    eh_o_proprio_aluno,
    eh_orientador,
    exigir_acesso_ao_aluno,
    filtrar_pelo_aluno,
    pode_aceder_aluno,
)
from .models import ItemCAT, RespostaCAT
from .motor import ARQUETIPOS
from .serializers import ItemCATSerializer, RespostaCATSerializer, item_para_aluno
from .services import estado_cat, repetir_cat


class BancoCATOrientador(BasePermission):
    message = "O banco de perguntas é reservado ao orientador; apagar não é permitido."

    def has_permission(self, request, view):
        if request.method == "DELETE":
            return False
        return eh_orientador(request)


class ItemCATViewSet(viewsets.ModelViewSet):
    """
    Banco de itens do CAT (RF04, RF05). Só o orientador vê e gere o banco
    completo (com os arquétipos das opções); o aluno recebe as perguntas,
    sem arquétipos, através de /api/cat/proxima/. Ninguém apaga pela API:
    desactiva-se com "ativo".
    """
    serializer_class = ItemCATSerializer
    permission_classes = [BancoCATOrientador]

    def get_queryset(self):
        # Quantas vezes cada arquétipo foi escolhido em cada pergunta (todas
        # as tentativas). Ajuda o orientador a ver perguntas desequilibradas.
        contagens = {
            f"_resp_{i}": Count("respostas", filter=Q(respostas__arquetipo_escolhido=a))
            for i, a in enumerate(ARQUETIPOS)
        }
        return ItemCAT.objects.annotate(_resp_total=Count("respostas"), **contagens)


class RespostaCATViewSet(viewsets.ModelViewSet):
    """
    Respostas ao CAT (RF04, RF06). Cada resposta é enviada individualmente
    (RNF de disponibilidade). O aluno regista as suas; o orientador só consulta.
    """
    serializer_class = RespostaCATSerializer
    permission_classes = [OrientadorLeAlunoEscreve]

    def get_queryset(self):
        return filtrar_pelo_aluno(self.request, RespostaCAT.objects.all())

    def perform_create(self, serializer):
        exigir_acesso_ao_aluno(self.request, serializer.validated_data["aluno"])
        serializer.save()

    def perform_update(self, serializer):
        aluno = serializer.validated_data.get("aluno", serializer.instance.aluno)
        exigir_acesso_ao_aluno(self.request, aluno)
        serializer.save()


class ProximaPerguntaView(APIView):
    """
    GET /api/cat/proxima/{aluno_id}/

    Devolve a próxima pergunta escolhida pelo CAT adaptativo para o aluno,
    com base nas respostas que ele já deu. Quando o teste termina, devolve
    terminado=true e o motivo (perfil_identificado, maximo_atingido ou
    banco_esgotado). Cada resposta continua a ser enviada individualmente
    para POST /api/respostas-cat/.
    """
    permission_classes = [OrientadorLeAlunoEscreve]

    def get(self, request, aluno_id):
        if not pode_aceder_aluno(request, aluno_id):
            return Response({"erro": "Sem acesso aos dados deste aluno."}, status=status.HTTP_403_FORBIDDEN)
        try:
            aluno = Aluno.objects.get(pk=aluno_id)
        except Aluno.DoesNotExist:
            return Response({"erro": "Aluno não encontrado."}, status=status.HTTP_404_NOT_FOUND)

        return Response(_formatar_estado(request, aluno, estado_cat(aluno)), status=status.HTTP_200_OK)


def _formatar_estado(request, aluno, estado):
    """O orientador vê tudo; o aluno não vê arquétipos, crença nem indicadores internos."""
    item = estado.pop("item")
    if eh_orientador(request):
        estado["item"] = ItemCATSerializer(item).data if item else None
        return estado
    return {
        "terminado": estado["terminado"],
        "tentativa": estado["tentativa"],
        "respondidas": estado["respondidas"],
        "pode_repetir": estado["pode_repetir"],
        "item": item_para_aluno(item, aluno) if item else None,
    }


class RepetirCATView(APIView):
    """
    POST /api/cat/repetir/{aluno_id}/
    Inicia a 2.ª (e última) tentativa do CAT, só quando a 1.ª terminou com
    confiança baixa. Só o próprio aluno pode pedir.
    """
    permission_classes = [OrientadorLeAlunoEscreve]

    def post(self, request, aluno_id):
        if not eh_o_proprio_aluno(request, aluno_id):
            return Response({"erro": "Só o próprio aluno pode repetir o teste."},
                            status=status.HTTP_403_FORBIDDEN)
        aluno = Aluno.objects.get(pk=aluno_id)
        try:
            estado = repetir_cat(aluno)
        except ValueError as e:
            return Response({"erro": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(_formatar_estado(request, aluno, estado), status=status.HTTP_200_OK)
