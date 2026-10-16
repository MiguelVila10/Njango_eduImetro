# Njango Edu: frontend

React 18 + Vite + Tailwind CSS 4 + React Router. Fala com o backend Django em `/api`.

## Pôr a correr

Precisas do Node 20 ou mais recente. Com o Django a correr em `localhost:8000`:

```
cd frontend
npm install
copy .env.example .env      (no Windows; no Linux/Mac: cp .env.example .env)
npm run dev
```

Abre http://localhost:5173.

Outros comandos:

- `npm test`: testes do cliente da API e das sessões;
- `npm run build`: versão final, gerada na pasta `dist/`.

## Como está organizado

```
src/
  api/          chamadas ao backend (uma função por endpoint)
    cliente.js  pedido único: cabeçalhos, erros, sessão expirada
    aluno.js    percurso do aluno
    orientador.js
  sessao/       sessão do aluno (token de 24 h) e do orientador (token DRF)
  hooks/        a lógica de cada ecrã (notas, teste, resultado…)
  rotas/        rotas protegidas e reacção à sessão expirada
  componentes/  peças partilhadas
  paginas/
    aluno/      Inicio, Registo, Notas, Teste, Resultado, CursoEscolhido, SessaoExpirada
    orientador/ Entrar, Painel, Alunos, FichaAluno, Cursos, Perguntas
```

A lógica fica nos `hooks`, e as páginas só mostram. Para trocar um ecrã provisório
pelo do design, substitui-se o conteúdo da página e mantém-se o hook.

## Rotas

| Rota | Quem | Ecrã |
|---|---|---|
| `/` | aluno | Boas-vindas |
| `/registo` | aluno | Nome, idade, escola |
| `/aluno/notas` | aluno com sessão | As 12 notas |
| `/aluno/teste` | aluno com sessão | Perguntas do teste adaptativo (e repetir, se for o caso) |
| `/aluno/resultado` | aluno com sessão | As 3 sugestões e a confirmação da escolha |
| `/aluno/curso-escolhido` | aluno com sessão | O curso escolhido e porquê |
| `/sessao-expirada` | aluno | O teste passou das 24 h |
| `/orientador/entrar` | orientador | Login |
| `/orientador` | orientador | Painel |
| `/orientador/alunos` e `/orientador/alunos/:id` | orientador | Lista e ficha de cada aluno |
| `/orientador/cursos` | orientador | Catálogo e contagens |
| `/orientador/perguntas` | orientador | Banco de perguntas (activar/desactivar) |

## Regras que o frontend respeita

- O aluno não tem conta: o token de sessão vai no cabeçalho `X-Sessao-Aluno` e vale 24 horas.
- Um 401 do servidor apaga a sessão e leva ao ecrã certo (sessão expirada ou login).
- A escolha do curso é definitiva: há sempre uma confirmação antes, e depois não se muda.
- O aluno nunca vê alertas de viés nem a confiança das respostas.
- O tempo de cada resposta e a posição da opção no ecrã são enviados ao backend,
  que os usa para avaliar a atenção.
