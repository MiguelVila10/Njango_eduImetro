@echo off
REM Faz uma copia de todos os dados deste computador (alunos, notas, respostas,
REM sugestoes, cursos, perguntas e contas de orientador) para o ficheiro
REM njangoedu_copia.json, na pasta ACIMA do projecto (fora do Git).
REM Nao pede a palavra-passe do MySQL: usa a que esta no .env.
REM ATENCAO: o ficheiro tem dados pessoais de alunos menores. Leva-o numa pen,
REM nao o envies por WhatsApp/e-mail e nunca o ponhas no GitHub.
cd /d "%~dp0"
call .venv\Scripts\activate.bat || (echo Nao encontrei o ambiente .venv. & pause & exit /b 1)

set "FICHEIRO=%~dp0..\njangoedu_copia.json"
python manage.py migrate || goto erro
python -X utf8 manage.py dumpdata --natural-foreign --natural-primary --exclude contenttypes --exclude auth.permission --exclude admin.logentry --exclude sessions --indent 1 -o "%FICHEIRO%" || goto erro

echo.
echo Copia feita: %FICHEIRO%
echo Leva este ficheiro numa pen e, no outro computador, poe-no na pasta acima do projecto
echo e da dois cliques em carregar_copia.bat.
pause
exit /b 0

:erro
echo.
echo Algo correu mal. Copia a mensagem acima e envia-a.
pause
exit /b 1
