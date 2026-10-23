# Njango Edu

Sistema de orientação vocacional para alunos da 9.ª classe em Luanda
(Projecto de Fim de Curso, IMETRO). Backend em Django + DRF (MySQL),
frontend em React (pasta `frontend/`).

## Ligar no Windows (forma rápida)

1. **Primeira vez / antes de uma demonstração:** dois cliques em
   `preparar_demo.bat`. Aplica as migrações e cria 7 alunos de
   demonstração (escola "Escola de demonstração") que passam pelo motor
   verdadeiro, para o painel do orientador não ficar vazio. Se a base
   estiver vazia, carrega também os 20 cursos e as perguntas do teste.
2. **Para usar:** dois cliques em `iniciar.bat`. Abre o backend e o
   frontend, cada um na sua janela, e depois o browser em
   http://localhost:5173. Para parar, fecha as duas janelas.

Para apagar só os alunos de demonstração:

```
python manage.py dados_demo --apagar
```

Os alunos de demonstração são dados simulados para apresentar o sistema;
não são resultados de testes com utilizadores reais.

## Levar os dados para outro computador

Cada computador tem a sua própria base de dados; o GitHub só leva o código.
Para ter os mesmos alunos noutro computador:

1. No computador com os dados: dois cliques em `copiar_dados.bat`. Cria
   `njangoedu_copia.json` na pasta acima do projecto (fora do Git).
2. Levar o ficheiro numa pen para a pasta acima do projecto no outro computador.
3. No outro computador: dois cliques em `carregar_copia.bat` e escrever `SIM`.
   Substitui os dados desse computador (que ficam guardados em
   `njangoedu_antes_de_carregar.json`).

O ficheiro tem dados pessoais de alunos menores: não o envies por WhatsApp ou
e-mail, não o ponhas no GitHub e apaga-o da pen depois de carregar.

## Comandos úteis

| Comando | Para quê |
|---|---|
| `python manage.py configurar_orientador --username NOME` | Criar uma conta de orientador |
| `python manage.py configurar_orientador --username NOME --nova-senha` | Mudar a palavra-passe |
| `python manage.py configurar_orientador --username NOME --email EMAIL` | Dar um e-mail à conta (para entrar com o e-mail) |
| `python manage.py aprovar_orientador` | Ver os pedidos de conta feitos em "Criar conta" |
| `python manage.py aprovar_orientador --email EMAIL` | Aprovar um pedido de conta (só depois disso a pessoa entra) |
| `python manage.py configurar_orientador --username NOME --administrador` | Tornar a conta administradora: vê "Pedidos de conta" no menu e aprova/recusa no próprio sistema |
| `python manage.py configurar_orientador --username NOME --remover-administrador` | Tirar o papel de administrador (a conta continua orientador) |
| `python manage.py configurar_orientador --listar` | Ver todas as contas de orientador e quem é administrador |
| `python manage.py seed_cursos` / `seed_itens_cat` | Carregar os cursos e o banco de perguntas |
| `python manage.py simular_cat` | Simulação do teste adaptativo com alunos sintéticos |
| `python manage.py test` | Testes do backend |
| `cd frontend && npm test` | Testes do frontend |

**Esqueci-me da palavra-passe.** Na página de entrar, o orientador pede um link por e-mail (vale 1 hora e só funciona uma vez). Sem configurar e-mail no `.env`, a mensagem com o link aparece na janela do backend — útil para testar e para a demonstração. Para enviar e-mails a sério, ver a secção "Recuperar palavra-passe" no `.env.example`. Se o e-mail não chegar, o administrador usa `configurar_orientador --username NOME --nova-senha`.

Mais detalhes do frontend em `frontend/README.md`.
