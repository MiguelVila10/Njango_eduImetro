@echo off
REM Carrega neste computador a copia feita com copiar_dados.bat.
REM SUBSTITUI todos os dados deste computador pelos do ficheiro
REM njangoedu_copia.json (que tem de estar na pasta ACIMA do projecto).
REM Antes de apagar, guarda os dados actuais em njangoedu_antes_de_carregar.json.
cd /d "%~dp0"
call .venv\Scripts\activate.bat || (echo Nao encontrei o ambiente .venv. & pause & exit /b 1)

set "FICHEIRO=%~dp0..\njangoedu_copia.json"
set "SEGURANCA=%~dp0..\njangoedu_antes_de_carregar.json"
if not exist "%FICHEIRO%" (
  echo Nao encontrei o ficheiro %FICHEIRO%
  echo Poe o njangoedu_copia.json na pasta acima do projecto e tenta de novo.
  pause
  exit /b 1
)

echo.
echo ATENCAO: isto apaga os dados que estao neste computador (alunos, cursos,
echo perguntas e contas de orientador) e poe no lugar os do ficheiro:
echo   %FICHEIRO%
echo Os dados actuais ficam guardados em:
echo   %SEGURANCA%
echo.
set /p RESPOSTA=Escreve SIM e carrega Enter para continuar: 
if /i not "%RESPOSTA%"=="SIM" (
  echo Cancelado. Nada foi alterado.
  pause
  exit /b 0
)

python manage.py migrate || goto erro
python -X utf8 manage.py dumpdata --natural-foreign --natural-primary --exclude contenttypes --exclude auth.permission --exclude admin.logentry --exclude sessions --indent 1 -o "%SEGURANCA%" || goto erro
python manage.py flush --no-input || goto erro
python -X utf8 manage.py loaddata "%FICHEIRO%" || goto erro_carregar

echo.
echo Pronto. Os dados do outro computador foram carregados.
echo Entra com a mesma conta de orientador que usas no outro computador.
pause
exit /b 0

:erro_carregar
echo.
echo Nao foi possivel carregar a copia. Para voltar aos dados anteriores, corre:
echo   python -X utf8 manage.py loaddata "%SEGURANCA%"
echo e envia a mensagem de erro acima.
pause
exit /b 1

:erro
echo.
echo Algo correu mal. Copia a mensagem acima e envia-a.
pause
exit /b 1
