from rest_framework.routers import DefaultRouter
from .views import CursoViewSet, PreRequisitoCursoViewSet, VetorIdealCursoViewSet

router = DefaultRouter()
router.register(r"cursos", CursoViewSet, basename="curso")
router.register(r"prerequisitos", PreRequisitoCursoViewSet, basename="prerequisitocurso")
router.register(r"vetores-ideais", VetorIdealCursoViewSet, basename="vetoridealcurso")

urlpatterns = router.urls