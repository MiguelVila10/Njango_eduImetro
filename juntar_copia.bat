@echo off
REM Junta a este computador os alunos da copia feita com copiar_dados.bat
REM (njangoedu_copia.json, na pasta ACIMA do projecto), SEM apagar nada.
REM Os alunos que ja existirem aqui nao sao repetidos.
REM Antes de juntar, guarda os dados actuais em njangoedu_antes_de_juntar.json.
cd /d "%~dp0"
call .venv\Scripts\activate.bat || (echo Nao encontrei o ambiente .venv. & pause & exit /b 1)

set "FICHEIRO=%~dp0..\njangoedu_copia.json"
set "SEGURANCA=%~dp0..\njangoedu_antes_de_juntar.json"
if not exist "%FICHEIRO%" (
  echo Nao encontrei o ficheiro %FICHEIRO%
  echo Poe o njangoedu_copia.json na pasta acima do projecto e tenta de novo.
  pause
  exit /b 1
)

python manage.py migrate || goto erro
python -X utf8 manage.py dumpdata --natural-foreign --natural-primary --exclude contenttypes --exclude auth.permission --exclude admin.logentry --exclude sessions --indent 1 -o "%SEGURANCA%" || goto erro
python -X utf8 manage.py juntar_alunos "%FICHEIRO%" || goto erro

echo.
echo Os dados que ja estavam neste computador ficaram como estavam.
pause
exit /b 0

:erro
echo.
echo Algo correu mal. Nada foi alterado. Copia a mensagem acima e envia-a.
pause
exit /b 1
