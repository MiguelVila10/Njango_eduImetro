# alunos/urls.py

from rest_framework.routers import DefaultRouter
from .views import AlunoViewSet

router = DefaultRouter()
router.register(r"alunos", AlunoViewSet, basename="aluno")

urlpatterns = router.urls
from rest_framework.routers import DefaultRouter
from .views import AlunoViewSet, NotaDisciplinaViewSet

router = DefaultRouter()
router.register(r"alunos", AlunoViewSet, basename="aluno")
router.register(r"notas-disciplina", NotaDisciplinaViewSet, basename="notadisciplina")

urlpatterns = router.urls