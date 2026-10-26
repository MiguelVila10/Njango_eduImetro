@echo off
REM Liga o Njango Edu para o abrir TAMBEM num telemovel ligado a mesma rede
REM Wi-Fi que este computador. Basta dar dois cliques neste ficheiro.
REM No telemovel, abre o endereco "Network" que aparece na janela do frontend
REM (ex.: http://192.168.1.20:5173). Para parar: fecha as duas janelas pretas.
REM Na primeira vez, o Windows pode perguntar se permite o acesso: escolhe
REM "Permitir" (redes privadas).
cd /d "%~dp0"

if not exist ".venv\Scripts\activate.bat" (
  echo Nao encontrei o ambiente .venv nesta pasta.
  pause
  exit /b 1
)

start "Njango Edu - backend" cmd /k "call .venv\Scripts\activate.bat && python manage.py runserver"
start "Njango Edu - frontend (telemovel)" cmd /k "cd frontend && set VITE_API_URL=/api&& npm run dev -- --host"

echo A ligar o sistema...
echo No telemovel, abre o endereco "Network" que aparece na janela do frontend.
timeout /t 8 /nobreak >nul
start "" http://localhost:5173
