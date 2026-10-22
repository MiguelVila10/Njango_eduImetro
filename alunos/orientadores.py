# alunos/orientadores.py
"""
Acesso do orientador: entrar (por e-mail ou nome de utilizador) e pedir uma
conta nova. Uma conta pedida fica pendente até ser aprovada por um
administrador (ver aprovar_conta_orientador).
"""

import re

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.permissions import BasePermission
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

from .models import PerfilOrientador
from .serializers import ESCOLA_CARACTERES, NOME_VALIDO, SIMBOLOS_SEGUIDOS, _letras, _normalizar_espacos

User = get_user_model()
NOME_GRUPO = "Orientador"


def _procurar_utilizador(identificador):
    identificador = (identificador or "").strip()
    if not identificador:
        return None
    if "@" in identificador:
        return User.objects.filter(email__iexact=identificador).order_by("id").first()
    return User.objects.filter(username=identificador).first()


def aprovar_conta_orientador(user):
    """Activa a conta, dá-lhe acesso de orientador e junta-a ao grupo Orientador."""
    from django.contrib.auth.models import Group

    from .management.commands.configurar_orientador import configurar_grupo

    try:
        grupo = Group.objects.get(name=NOME_GRUPO)
    except Group.DoesNotExist:
        grupo = configurar_grupo()
    with transaction.atomic():
        user.is_active = True
        user.is_staff = True
        user.is_superuser = False
        user.save(update_fields=["is_active", "is_staff", "is_superuser"])
        user.groups.add(grupo)
        perfil = getattr(user, "perfil_orientador", None)
        if perfil and perfil.aprovado_em is None:
            perfil.aprovado_em = timezone.now()
            perfil.save(update_fields=["aprovado_em"])
    return user


def eh_administrador(user):
    """Quem pode aprovar pedidos de conta: superutilizador ou quem tem a permissão de gerir perfis."""
    return bool(
        user and user.is_authenticated and user.is_active
        and (user.is_superuser or user.has_perm("alunos.change_perfilorientador"))
    )


class EhAdministrador(BasePermission):
    message = "Só o administrador pode gerir os pedidos de conta."

    def has_permission(self, request, view):
        return eh_administrador(request.user)


class EntrarView(APIView):
    """
    POST /api/auth/login/   {"email": "...", "password": "..."}
    (aceita também "username" para contas antigas criadas por comando)

    200 {"token", "nome", "email"} · 400 credenciais erradas ·
    403 {"codigo": "conta_pendente"} quando a conta ainda não foi aprovada.
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "acesso"

    def post(self, request):
        identificador = request.data.get("email") or request.data.get("username")
        senha = request.data.get("password") or ""
        user = _procurar_utilizador(identificador)
        if user is None or not senha or not user.check_password(senha):
            return Response({"erro": "E-mail ou palavra-passe incorrectos."}, status=status.HTTP_400_BAD_REQUEST)
        if not user.is_active:
            return Response(
                {"codigo": "conta_pendente", "erro": "A sua conta ainda aguarda aprovação de um administrador."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not user.is_staff:
            return Response({"erro": "Esta conta não tem acesso à área do orientador."}, status=status.HTTP_403_FORBIDDEN)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            "token": token.key, "nome": user.get_full_name() or user.username, "email": user.email,
            "administrador": eh_administrador(user),
        })


class RegistoOrientadorSerializer(serializers.Serializer):
    nome = serializers.CharField(max_length=80)
    email = serializers.EmailField(max_length=150)
    escola = serializers.CharField(max_length=120)
    password = serializers.CharField(write_only=True, max_length=128)
    confirmar_password = serializers.CharField(write_only=True, max_length=128)
    aceita_termos = serializers.BooleanField()

    def validate_nome(self, value):
        nome = _normalizar_espacos(value)
        if not NOME_VALIDO.match(nome) or _letras(nome) < 2:
            raise serializers.ValidationError("O nome só pode ter letras, espaços, hífen ou apóstrofo.")
        if len(nome.split(" ")) < 2:
            raise serializers.ValidationError("Indique o nome completo (nome e apelido).")
        return nome

    def validate_email(self, value):
        email = value.strip().lower()
        if User.objects.filter(email__iexact=email).exists() or User.objects.filter(username__iexact=email).exists():
            raise serializers.ValidationError("Já existe uma conta com este e-mail.")
        return email

    def validate_escola(self, value):
        escola = _normalizar_espacos(value)
        if not ESCOLA_CARACTERES.match(escola) or SIMBOLOS_SEGUIDOS.search(escola) or _letras(escola) < 3:
            raise serializers.ValidationError("Indique o nome da escola ou instituição com letras.")
        return escola

    def validate_aceita_termos(self, value):
        if not value:
            raise serializers.ValidationError("É preciso aceitar os termos de utilização e a política de privacidade.")
        return value

    def validate(self, attrs):
        senha = attrs["password"]
        if senha != attrs["confirmar_password"]:
            raise serializers.ValidationError({"confirmar_password": "As palavras-passe não são iguais."})
        if len(senha) < 8 or not re.search(r"[^\W\d_]", senha) or not re.search(r"\d", senha):
            raise serializers.ValidationError({"password": "Use pelo menos 8 caracteres, com letras e números."})
        partes = attrs["nome"].split(" ")
        provisorio = User(username=attrs["email"], email=attrs["email"], first_name=partes[0], last_name=" ".join(partes[1:]))
        try:
            validate_password(senha, user=provisorio)
        except DjangoValidationError:
            raise serializers.ValidationError(
                {"password": "Essa palavra-passe é fácil de adivinhar. Escolha outra, com letras e números."}
            )
        return attrs

    def create(self, dados):
        partes = dados["nome"].split(" ")
        with transaction.atomic():
            user = User.objects.create_user(
                username=dados["email"], email=dados["email"], password=dados["password"],
                first_name=partes[0][:150], last_name=" ".join(partes[1:])[:150],
                is_active=False, is_staff=False,
            )
            PerfilOrientador.objects.create(user=user, escola=dados["escola"])
        return user


class RegistoOrientadorView(APIView):
    """
    POST /api/orientadores/registo/
    Cria o pedido de conta. A conta fica inactiva até um administrador a aprovar.
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "acesso"

    def post(self, request):
        serializer = RegistoOrientadorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({"estado": "pendente", "email": user.email}, status=status.HTTP_201_CREATED)


def _pedido_para_json(perfil):
    return {
        "id": perfil.pk,
        "nome": perfil.user.get_full_name() or perfil.user.username,
        "email": perfil.user.email,
        "escola": perfil.escola,
        "criado_em": perfil.criado_em,
        "aprovado_em": perfil.aprovado_em,
    }


class PedidosContaView(APIView):
    """
    GET /api/orientadores/pedidos/  (só o administrador)
    {"pendentes": [...], "aprovados": [...últimos 20]}
    """

    permission_classes = [EhAdministrador]

    def get(self, request):
        base = PerfilOrientador.objects.select_related("user")
        return Response({
            "pendentes": [_pedido_para_json(p) for p in base.filter(aprovado_em__isnull=True).order_by("criado_em")],
            "aprovados": [_pedido_para_json(p) for p in base.filter(aprovado_em__isnull=False).order_by("-aprovado_em")[:20]],
        })


class DecidirPedidoView(APIView):
    """
    POST /api/orientadores/pedidos/{id}/aprovar/  → activa a conta
    POST /api/orientadores/pedidos/{id}/recusar/  → apaga o pedido (a conta nunca esteve activa)
    """

    permission_classes = [EhAdministrador]

    def post(self, request, pk, decisao):
        if decisao not in ("aprovar", "recusar"):
            return Response({"erro": "Decisão inválida."}, status=status.HTTP_404_NOT_FOUND)
        perfil = PerfilOrientador.objects.select_related("user").filter(pk=pk).first()
        if perfil is None:
            return Response({"erro": "Pedido não encontrado."}, status=status.HTTP_404_NOT_FOUND)
        if decisao == "aprovar":
            aprovar_conta_orientador(perfil.user)
            perfil.refresh_from_db()
            return Response(_pedido_para_json(perfil))
        if not perfil.pendente:
            return Response({"erro": "Esta conta já foi aprovada e não pode ser recusada aqui."},
                            status=status.HTTP_409_CONFLICT)
        perfil.user.delete()  # apaga também o perfil (on_delete=CASCADE)
        return Response(status=status.HTTP_204_NO_CONTENT)
