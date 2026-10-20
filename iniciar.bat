@echo off
REM Liga o Njango Edu: backend (Django) e frontend (React), cada um na sua
REM janela, e abre o browser. Basta dar dois cliques neste ficheiro.
REM Para parar: fecha as duas janelas pretas.
cd /d "%~dp0"

if not exist ".venv\Scripts\activate.bat" (
  echo Nao encontrei o ambiente .venv nesta pasta.
  pause
  exit /b 1
)

start "Njango Edu - backend" cmd /k "call .venv\Scripts\activate.bat && python manage.py runserver"
start "Njango Edu - frontend" cmd /k "cd frontend && npm run dev"

echo A ligar o sistema... o browser abre daqui a uns segundos.
timeout /t 8 /nobreak >nul
start "" http://localhost:5173
