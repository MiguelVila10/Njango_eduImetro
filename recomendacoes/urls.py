# recomendacoes/urls.py

from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import PainelResumoView, RecomendacaoViewSet

router = DefaultRouter()
router.register(r"recomendacoes", RecomendacaoViewSet, basename="recomendacao")

urlpatterns = [
    path("painel/resumo/", PainelResumoView.as_view(), name="painel-resumo"),
] + router.urls
