# cat/views.py

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView

from alunos.models import Aluno
from .models import ItemCAT, RespostaCAT
from .serializers import ItemCATSerializer, RespostaCATSerializer
from .services import estado_cat


class ItemCATViewSet(viewsets.ModelViewSet):
    """Endpoint CRUD para itens do banco CAT (RF04, RF05)."""
    queryset = ItemCAT.objects.all()
    serializer_class = ItemCATSerializer


class RespostaCATViewSet(viewsets.ModelViewSet):
    """Endpoint CRUD para respostas ao CAT (RF04, RF06)."""
    queryset = RespostaCAT.objects.all()
    serializer_class = RespostaCATSerializer


class ProximaPerguntaView(APIView):
    """
    GET /api/cat/proxima/{aluno_id}/

    Devolve a próxima pergunta escolhida pelo CAT adaptativo para o aluno,
    com base nas respostas que ele já deu. Quando o teste termina, devolve
    terminado=true e o motivo (perfil_identificado, maximo_atingido ou
    banco_esgotado). Cada resposta continua a ser enviada individualmente
    para POST /api/respostas-cat/.
    """

    def get(self, request, aluno_id):
        try:
            aluno = Aluno.objects.get(pk=aluno_id)
        except Aluno.DoesNotExist:
            return Response({"erro": "Aluno não encontrado."}, status=status.HTTP_404_NOT_FOUND)

        estado = estado_cat(aluno)
        item = estado.pop("item")
        estado["item"] = ItemCATSerializer(item).data if item else None
        return Response(estado, status=status.HTTP_200_OK)
