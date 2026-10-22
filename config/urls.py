# config/urls.py

from django.contrib import admin
from django.urls import include, path

from alunos.orientadores import EntrarView, RegistoOrientadorView

urlpatterns = [
    path("admin/", admin.site.urls),
    # Acesso do orientador: entrar (e-mail ou utilizador) e pedir conta nova
    path("api/auth/login/", EntrarView.as_view(), name="auth-login"),
    path("api/orientadores/registo/", RegistoOrientadorView.as_view(), name="orientador-registo"),
    # Login/logout na API navegável (testes no browser)
    path("api-auth/", include("rest_framework.urls")),
    path("api/", include("alunos.urls")),
    path("api/", include("cursos.urls")),
    path("api/", include("cat.urls")),
    path("api/", include("recomendacoes.urls")),
]
