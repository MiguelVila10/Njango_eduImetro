from rest_framework.routers import DefaultRouter
from .views import RecomendacaoViewSet

router = DefaultRouter()
router.register(r"recomendacoes", RecomendacaoViewSet, basename="recomendacao")

urlpatterns = router.urls