from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets
from .models import Recomendacao
from .serializers import RecomendacaoSerializer


class RecomendacaoViewSet(viewsets.ModelViewSet):
    """Endpoint CRUD para recomendações de curso (RF10, RF13)."""
    queryset = Recomendacao.objects.all()
    serializer_class = RecomendacaoSerializer