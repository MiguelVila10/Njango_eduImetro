# config/urls.py

from django.contrib import admin
from django.urls import include, path

from alunos.orientadores import DecidirPedidoView, EntrarView, PedidosContaView, RegistoOrientadorView

urlpatterns = [
    path("admin/", admin.site.urls),
    # Acesso do orientador: entrar (e-mail ou utilizador) e pedir conta nova
    path("api/auth/login/", EntrarView.as_view(), name="auth-login"),
    path("api/orientadores/registo/", RegistoOrientadorView.as_view(), name="orientador-registo"),
    path("api/orientadores/pedidos/", PedidosContaView.as_view(), name="orientador-pedidos"),
    path("api/orientadores/pedidos/<int:pk>/<str:decisao>/", DecidirPedidoView.as_view(), name="orientador-decidir"),
    # Login/logout na API navegável (testes no browser)
    path("api-auth/", include("rest_framework.urls")),
    path("api/", include("alunos.urls")),
    path("api/", include("cursos.urls")),
    path("api/", include("cat.urls")),
    path("api/", include("recomendacoes.urls")),
]
