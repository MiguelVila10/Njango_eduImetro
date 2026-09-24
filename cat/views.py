from rest_framework import viewsets
from .models import ItemCAT, RespostaCAT
from .serializers import ItemCATSerializer, RespostaCATSerializer


class ItemCATViewSet(viewsets.ModelViewSet):
    """Endpoint CRUD para itens do banco CAT (RF04, RF05)."""
    queryset = ItemCAT.objects.all()
    serializer_class = ItemCATSerializer


class RespostaCATViewSet(viewsets.ModelViewSet):
    """Endpoint CRUD para respostas ao CAT (RF04, RF06)."""
    queryset = RespostaCAT.objects.all()
    serializer_class = RespostaCATSerializer