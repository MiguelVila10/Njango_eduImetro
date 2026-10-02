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
