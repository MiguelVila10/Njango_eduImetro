# alunos/apoio_testes.py
"""Utilitários partilhados pelos testes da API (não é um módulo de testes)."""

from django.contrib.auth import get_user_model


def autenticar_orientador(client, username="orientador"):
    """Cria um orientador (staff) e autentica o cliente de testes com ele."""
    user = get_user_model().objects.create_user(
        username=username, password="senha-de-teste-123", is_staff=True
    )
    client.force_login(user)
    return user


def autenticar_aluno(client, aluno):
    """Dá ao cliente de testes a sessão do aluno (como o frontend faria)."""
    from .sessao import gerar_token_sessao
    client.credentials(HTTP_X_SESSAO_ALUNO=gerar_token_sessao(aluno))
