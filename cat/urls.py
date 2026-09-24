from rest_framework.routers import DefaultRouter
from .views import ItemCATViewSet, RespostaCATViewSet

router = DefaultRouter()
router.register(r"itens-cat", ItemCATViewSet, basename="itemcat")
router.register(r"respostas-cat", RespostaCATViewSet, basename="respostacat")

urlpatterns = router.urls