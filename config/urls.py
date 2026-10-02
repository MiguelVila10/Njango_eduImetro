# config/urls.py

from django.contrib import admin
from django.urls import include, path
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path("admin/", admin.site.urls),
    # Login do orientador para o frontend: devolve {"token": "..."}
    path("api/auth/login/", obtain_auth_token, name="auth-login"),
    # Login/logout na API navegável (testes no browser)
    path("api-auth/", include("rest_framework.urls")),
    path("api/", include("alunos.urls")),
    path("api/", include("cursos.urls")),
    path("api/", include("cat.urls")),
    path("api/", include("recomendacoes.urls")),
]
