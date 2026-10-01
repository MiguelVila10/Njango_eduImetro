# cat/urls.py

from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import ItemCATViewSet, RespostaCATViewSet, ProximaPerguntaView

router = DefaultRouter()
router.register(r"itens-cat", ItemCATViewSet, basename="itemcat")
router.register(r"respostas-cat", RespostaCATViewSet, basename="respostacat")

urlpatterns = [
    path("cat/proxima/<int:aluno_id>/", ProximaPerguntaView.as_view(), name="cat-proxima"),
] + router.urls
