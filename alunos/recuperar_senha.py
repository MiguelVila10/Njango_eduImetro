# alunos/recuperar_senha.py
"""
Recuperar a palavra-passe do orientador por e-mail.

1. POST /api/auth/recuperar/  {"email"}
   Responde sempre da mesma forma (não revela se o e-mail tem conta). Se existir
   uma conta de orientador activa com esse e-mail, envia um link para
   {FRONTEND_URL}/orientador/nova-senha?uid=...&token=...

2. POST /api/auth/nova-senha/  {"uid", "token", "password", "confirmar_password"}
   Define a palavra-passe nova. O link vale 1 hora (PASSWORD_RESET_TIMEOUT) e
   deixa de funcionar assim que a palavra-passe muda. As sessões abertas noutros
   dispositivos são terminadas.
"""

import logging
import re

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import serializers, status
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView

User = get_user_model()
log = logging.getLogger(__name__)

MENSAGEM_ENVIADO = (
    "Se existir uma conta de orientador com este e-mail, enviámos um link para criar "
    "uma palavra-passe nova. O link vale 1 hora."
)
LINK_INVALIDO = "Este link já não é válido. Peça um link novo."


def link_nova_senha(user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)
    return f"{settings.FRONTEND_URL}/orientador/nova-senha?uid={uid}&token={token}"


def enviar_email_recuperacao(user):
    nome = user.first_name or user.get_full_name() or "orientador"
    texto = (
        f"Olá, {nome}.\n\n"
        "Recebemos um pedido para criar uma palavra-passe nova na área do orientador do Njango Edu.\n\n"
        f"Abra este link para escolher a palavra-passe nova (vale 1 hora):\n{link_nova_senha(user)}\n\n"
        "Se não foi você que pediu, ignore este e-mail: a sua palavra-passe continua a mesma.\n\n"
        "Njango Edu"
    )
    send_mail("Njango Edu — criar uma palavra-passe nova", texto, settings.DEFAULT_FROM_EMAIL, [user.email])


class PedirRecuperacaoView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "acesso"

    def post(self, request):
        email = str(request.data.get("email") or "").strip()
        try:
            serializers.EmailField().run_validation(email)
        except serializers.ValidationError:
            return Response({"email": ["Este e-mail não parece válido."]}, status=status.HTTP_400_BAD_REQUEST)

        # Só contas de orientador já aprovadas e com palavra-passe utilizável.
        for user in User.objects.filter(email__iexact=email, is_active=True, is_staff=True):
            if not user.has_usable_password():
                continue
            try:
                enviar_email_recuperacao(user)
            except Exception:  # noqa: BLE001 — não revelar a quem pede se o envio falhou
                log.exception("Não foi possível enviar o e-mail de recuperação para o utilizador %s", user.pk)
        return Response({"mensagem": MENSAGEM_ENVIADO})


def _utilizador_do_link(uid, token):
    try:
        pk = force_str(urlsafe_base64_decode(uid or ""))
        user = User.objects.get(pk=pk, is_active=True, is_staff=True)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return None
    return user if default_token_generator.check_token(user, token or "") else None


class NovaSenhaSerializer(serializers.Serializer):
    uid = serializers.CharField(max_length=64)
    token = serializers.CharField(max_length=128)
    password = serializers.CharField(write_only=True, max_length=128, required=False, allow_blank=True)
    confirmar_password = serializers.CharField(write_only=True, max_length=128, required=False, allow_blank=True)

    def __init__(self, *args, so_verificar=False, **kwargs):
        super().__init__(*args, **kwargs)
        self.so_verificar = so_verificar

    def validate(self, attrs):
        user = _utilizador_do_link(attrs["uid"], attrs["token"])
        if user is None:
            raise serializers.ValidationError({"codigo": "link_invalido", "erro": LINK_INVALIDO})
        attrs["user"] = user
        if self.so_verificar:
            return attrs

        senha = attrs.get("password") or ""
        if len(senha) < 8 or not re.search(r"[^\W\d_]", senha) or not re.search(r"\d", senha):
            raise serializers.ValidationError({"password": "Use pelo menos 8 caracteres, com letras e números."})
        if senha != (attrs.get("confirmar_password") or ""):
            raise serializers.ValidationError({"confirmar_password": "As palavras-passe não são iguais."})
        try:
            validate_password(senha, user=user)
        except DjangoValidationError:
            raise serializers.ValidationError(
                {"password": "Essa palavra-passe é fácil de adivinhar. Escolha outra, com letras e números."}
            )
        return attrs


class NovaSenhaView(APIView):
    """
    GET  /api/auth/nova-senha/?uid=...&token=...  → 200 se o link ainda vale (para a página avisar logo)
    POST /api/auth/nova-senha/                    → define a palavra-passe nova
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "acesso"

    @staticmethod
    def _erro(serializer):
        erros = serializer.errors
        if erros.get("codigo") or "uid" in erros or "token" in erros:
            return Response({"codigo": "link_invalido", "erro": LINK_INVALIDO}, status=status.HTTP_400_BAD_REQUEST)
        return Response(erros, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        serializer = NovaSenhaSerializer(data=request.query_params, so_verificar=True)
        if not serializer.is_valid():
            return self._erro(serializer)
        return Response({"valido": True, "email": serializer.validated_data["user"].email})

    def post(self, request):
        serializer = NovaSenhaSerializer(data=request.data)
        if not serializer.is_valid():
            return self._erro(serializer)
        user = serializer.validated_data["user"]
        user.set_password(serializer.validated_data["password"])
        user.save(update_fields=["password"])
        Token.objects.filter(user=user).delete()  # termina as sessões abertas
        return Response({"mensagem": "Palavra-passe alterada. Já pode entrar.", "email": user.email})
