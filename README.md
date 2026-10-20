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

## Comandos úteis

| Comando | Para quê |
|---|---|
| `python manage.py configurar_orientador --username NOME` | Criar uma conta de orientador |
| `python manage.py configurar_orientador --username NOME --nova-senha` | Mudar a palavra-passe |
| `python manage.py seed_cursos` / `seed_itens_cat` | Carregar os cursos e o banco de perguntas |
| `python manage.py simular_cat` | Simulação do teste adaptativo com alunos sintéticos |
| `python manage.py test` | Testes do backend |
| `cd frontend && npm test` | Testes do frontend |

Mais detalhes do frontend em `frontend/README.md`.
