# alunos/sessao.py
"""
Controlo de acesso aos dados dos alunos (RNF de privacidade — alunos menores).

Dois tipos de utilizador:

- Orientador: utilizador Django com is_staff. Faz login (token ou sessão)
  e vê os dados de todos os alunos.
- Aluno: NÃO tem conta nem palavra-passe. Ao iniciar o teste
  (POST /api/alunos/) recebe um token de sessão assinado, que o frontend
  envia no cabeçalho X-Sessao-Aluno. O token só dá acesso aos dados desse
  aluno e expira (SESSAO_ALUNO_DURACAO). Não é guardado na base de dados
  e não permite reentrada depois de expirar.
"""

from django.conf import settings
from django.core import signing
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import BasePermission, SAFE_METHODS

CABECALHO = "HTTP_X_SESSAO_ALUNO"
SALT = "njango-edu.sessao-aluno"


def gerar_token_sessao(aluno):
    return signing.dumps({"aluno": aluno.pk}, salt=SALT)


def aluno_id_da_sessao(request):
    """Devolve o id do aluno do token de sessão válido, ou None."""
    token = request.META.get(CABECALHO)
    if not token:
        return None
    try:
        dados = signing.loads(
            token, salt=SALT,
            max_age=settings.SESSAO_ALUNO_DURACAO.total_seconds(),
        )
    except signing.BadSignature:  # inclui token expirado
        return None
    return dados.get("aluno")


def eh_orientador(request):
    user = getattr(request, "user", None)
    return bool(user and user.is_authenticated and user.is_staff)


def pode_aceder_aluno(request, aluno_id):
    """O orientador acede a todos; o aluno só ao seu próprio registo."""
    if eh_orientador(request):
        return True
    return aluno_id is not None and aluno_id_da_sessao(request) == int(aluno_id)


def filtrar_pelo_aluno(request, queryset, campo="aluno_id"):
    """Orientador vê tudo; o aluno só os seus registos; sem sessão, nada."""
    if eh_orientador(request):
        return queryset
    aluno_id = aluno_id_da_sessao(request)
    if aluno_id is None:
        return queryset.none()
    return queryset.filter(**{campo: aluno_id})


def exigir_acesso_ao_aluno(request, aluno):
    if not pode_aceder_aluno(request, aluno.pk):
        raise PermissionDenied("Só podes registar dados no teu próprio perfil.")


class EhOrientador(BasePermission):
    """Permissão por omissão da API: só o orientador."""
    message = "Acesso reservado ao orientador."

    def has_permission(self, request, view):
        return eh_orientador(request)


class OrientadorOuSessaoDoAluno(BasePermission):
    """
    Orientador: acesso total. Aluno: precisa de uma sessão válida; o acesso a
    cada objecto é verificado em has_object_permission (e nas querysets).
    """
    message = "Sessão do aluno inválida ou expirada."

    def has_permission(self, request, view):
        return eh_orientador(request) or aluno_id_da_sessao(request) is not None

    def has_object_permission(self, request, view, obj):
        aluno_id = getattr(obj, "aluno_id", None)
        if aluno_id is None:  # o próprio Aluno
            aluno_id = obj.pk
        return pode_aceder_aluno(request, aluno_id)


class LeituraPublicaEscritaOrientador(BasePermission):
    """Catálogo (cursos, perguntas): qualquer um lê; só o orientador altera."""
    message = "Só o orientador pode alterar o catálogo."

    def has_permission(self, request, view):
        return request.method in SAFE_METHODS or eh_orientador(request)
