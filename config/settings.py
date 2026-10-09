"""
Django settings for config project (Njango Edu).

Valores sensíveis e dependentes da máquina vêm do ficheiro .env (nunca do
Git). Sem .env, o projecto arranca em modo de desenvolvimento.
"""

import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")


def _lista(valor):
    return [v.strip() for v in valor.split(",") if v.strip()]


# --- Segurança ---------------------------------------------------------------

DEBUG = os.getenv("DJANGO_DEBUG", "True").lower() == "true"

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")
if not SECRET_KEY:
    if not DEBUG:
        raise RuntimeError("Defina DJANGO_SECRET_KEY no .env antes de correr com DEBUG=False.")
    # Chave só para desenvolvimento local; em produção vem sempre do .env.
    SECRET_KEY = "django-insecure-apenas-para-desenvolvimento-local"

ALLOWED_HOSTS = _lista(os.getenv("DJANGO_ALLOWED_HOSTS", "127.0.0.1,localhost"))

if not DEBUG:
    # Produção (servido por HTTPS — Cap. V, implantação)
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_CONTENT_TYPE_NOSNIFF = True


# --- Aplicações ---------------------------------------------------------------

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "rest_framework.authtoken",
    "alunos",
    "cursos",
    "cat",
    "recomendacoes",
    "filtro_regras",
    "deteccao_vieses",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# --- Base de dados (MySQL, credenciais no .env) --------------------------------

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": os.getenv("DB_NAME"),
        "USER": os.getenv("DB_USER"),
        "PASSWORD": os.getenv("DB_PASSWORD"),
        "HOST": os.getenv("DB_HOST", "127.0.0.1"),
        "PORT": os.getenv("DB_PORT", "3306"),
        "OPTIONS": {"charset": "utf8mb4"},
    }
}


# --- Palavras-passe ------------------------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# --- Internacionalização -------------------------------------------------------

LANGUAGE_CODE = "pt-pt"
TIME_ZONE = "Africa/Luanda"
USE_I18N = True
USE_TZ = True

# Explícito para as migrações serem iguais em qualquer versão do Django.
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# --- Ficheiros estáticos -------------------------------------------------------

STATIC_URL = "static/"


# --- Email ---------------------------------------------------------------------

MAILERS = {
    "default": {
        "BACKEND": "django.core.mail.backends.console.EmailBackend",
    },
}


# --- API (Django REST Framework) -----------------------------------------------
# Por omissão, tudo é reservado ao orientador (utilizador staff). Os endpoints
# que o aluno usa abrem-se explicitamente nas views (RNF de privacidade:
# os alunos são menores de idade).

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "alunos.sessao.EhOrientador",
    ],
}

# Validade da sessão do aluno (token devolvido ao criar o aluno). O aluno não
# tem conta nem palavra-passe; a sessão expira e não há reentrada.
SESSAO_ALUNO_DURACAO = timedelta(hours=int(os.getenv("SESSAO_ALUNO_HORAS", "24")))

# CAT: resposta abaixo deste tempo conta como "demasiado rápida" (limiar
# provisório; os itens têm 25-35 palavras — afinar no piloto).
CAT_LIMIAR_TEMPO_RAPIDO_MS = int(os.getenv("CAT_LIMIAR_TEMPO_RAPIDO_MS", "3000"))


# --- CORS (frontend React) -----------------------------------------------------

CORS_ALLOWED_ORIGINS = _lista(
    os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
)
CORS_ALLOW_HEADERS = [
    "accept",
    "authorization",
    "content-type",
    "x-csrftoken",
    "x-requested-with",
    "x-sessao-aluno",
]
