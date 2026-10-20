@echo off
REM Prepara a base de dados para uma demonstracao (ex.: defesa):
REM aplica migracoes e cria os alunos de demonstracao (se a base estiver
REM vazia, carrega tambem os cursos e as perguntas) (escola "Escola de demonstracao").
REM Os alunos reais nao sao tocados.
cd /d "%~dp0"
call .venv\Scripts\activate.bat || (echo Nao encontrei o ambiente .venv. & pause & exit /b 1)

python manage.py migrate || goto erro
python manage.py dados_demo || goto erro

echo.
echo Pronto. Para apagar so os alunos de demonstracao: python manage.py dados_demo --apagar
pause
exit /b 0

:erro
echo.
echo Algo correu mal. Copia a mensagem acima e envia-a.
pause
exit /b 1
