# alunos/sessao.py
"""
Controlo de acesso aos dados dos alunos (RNF de privacidade — alunos menores).

Dois tipos de utilizador:

- Orientador: utilizador Django com is_staff. Faz login (token ou sessão).
  Regra de negócio: o orientador NÃO altera dados dos alunos. Só consulta
  (alunos, notas, respostas, recomendações) e gere o catálogo (adiciona e
  edita cursos, regras, vetores ideais e perguntas do CAT).
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


def eh_o_proprio_aluno(request, aluno_id):
    """Verdadeiro só para o aluno dono do registo (o orientador não conta)."""
    return aluno_id is not None and aluno_id_da_sessao(request) == int(aluno_id)


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
    """Escrita de dados do aluno: só o próprio aluno (o orientador só consulta)."""
    if not eh_o_proprio_aluno(request, aluno.pk):
        raise PermissionDenied("Só podes registar dados no teu próprio perfil.")


class EhOrientador(BasePermission):
    """Permissão por omissão da API: só o orientador."""
    message = "Acesso reservado ao orientador."

    def has_permission(self, request, view):
        return eh_orientador(request)


class OrientadorLeAlunoEscreve(BasePermission):
    """
    Dados dos alunos (perfil, notas, respostas, recomendações):
    - orientador: só leitura;
    - aluno: lê e escreve, mas só os seus próprios dados (sessão válida).
    """
    message = "O orientador só pode consultar; o aluno precisa de uma sessão válida."

    def has_permission(self, request, view):
        if eh_orientador(request):
            return request.method in SAFE_METHODS
        return aluno_id_da_sessao(request) is not None

    def has_object_permission(self, request, view, obj):
        aluno_id = getattr(obj, "aluno_id", None)
        if aluno_id is None:  # o próprio Aluno
            aluno_id = obj.pk
        if eh_orientador(request):
            return request.method in SAFE_METHODS
        return eh_o_proprio_aluno(request, aluno_id)


class CatalogoOrientador(BasePermission):
    """
    Catálogo (cursos, regras, vetores ideais, perguntas do CAT):
    qualquer um lê; o orientador adiciona e edita. Ninguém apaga pela API —
    apagar um curso apagaria as recomendações já feitas; nas perguntas usa-se
    o campo "ativo".
    """
    message = "Só o orientador pode adicionar ou editar o catálogo; apagar não é permitido."

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        if request.method == "DELETE":
            return False
        return eh_orientador(request)
