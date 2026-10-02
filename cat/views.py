# cat/views.py

from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from alunos.models import Aluno
from alunos.sessao import (
    LeituraPublicaEscritaOrientador,
    OrientadorOuSessaoDoAluno,
    exigir_acesso_ao_aluno,
    filtrar_pelo_aluno,
    pode_aceder_aluno,
)
from .models import ItemCAT, RespostaCAT
from .serializers import ItemCATSerializer, RespostaCATSerializer
from .services import estado_cat


class ItemCATViewSet(viewsets.ModelViewSet):
    """Banco de itens do CAT (RF04, RF05). Leitura pública; só o orientador altera."""
    queryset = ItemCAT.objects.all()
    serializer_class = ItemCATSerializer
    permission_classes = [LeituraPublicaEscritaOrientador]


class RespostaCATViewSet(viewsets.ModelViewSet):
    """
    Respostas ao CAT (RF04, RF06). Cada resposta é enviada individualmente
    (RNF de disponibilidade). O aluno só vê e regista as suas.
    """
    serializer_class = RespostaCATSerializer
    permission_classes = [OrientadorOuSessaoDoAluno]

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
    permission_classes = [OrientadorOuSessaoDoAluno]

    def get(self, request, aluno_id):
        if not pode_aceder_aluno(request, aluno_id):
            return Response({"erro": "Sem acesso aos dados deste aluno."}, status=status.HTTP_403_FORBIDDEN)
        try:
            aluno = Aluno.objects.get(pk=aluno_id)
        except Aluno.DoesNotExist:
            return Response({"erro": "Aluno não encontrado."}, status=status.HTTP_404_NOT_FOUND)

        estado = estado_cat(aluno)
        item = estado.pop("item")
        estado["item"] = ItemCATSerializer(item).data if item else None
        return Response(estado, status=status.HTTP_200_OK)
