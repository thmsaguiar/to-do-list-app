# To-Do List APP — Next.js + TypeScript + tRPC + React

![GitHub repo size](https://img.shields.io/github/repo-size/thmsaguiar/to-do-list-app)
![GitHub last commit](https://img.shields.io/github/last-commit/thmsaguiar/to-do-list-app)
![npm](https://img.shields.io/npm/v/npm)
![GitHub top language](https://img.shields.io/github/languages/top/thmsaguiar/to-do-list-app)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deploy%20Ativo-black?style=flat&logo=vercel)](https://thmsaguiar-todo-app.vercel.app/)

---

## <a name="description">Descrição</a>

> 🚀 **Deploy em Produção:** Acesse o projeto online em [https://thmsaguiar-todo-app.vercel.app/](https://thmsaguiar-todo-app.vercel.app/)

Aplicação fullstack de gerenciamento de tarefas desenvolvida com Next.js 15, React e tRPC, como parte de um desafio técnico de Software Engineer.

O projeto tem como objetivo implementar operações CRUD (criação, listagem, atualização e exclusão de tarefas), integrando frontend e backend com tipagem de ponta a ponta (End-to-End Type Safety), validação de dados e tratamento de erros.

A aplicação utiliza estratégias de renderização do Next.js, incluindo Server-Side Rendering (SSR) para carregamento inicial das tarefas, além de componentes funcionais e hooks do React para proporcionar uma experiência de usuário simples, intuitiva e responsiva.

A interface segue uma abordagem Neo-Brutalista, com identidade visual marcante e foco na clareza e usabilidade.

## Índice

1. [Descrição](#description)
2. [Arquitetura e Decisões Técnicas](#arquitetura)
3. [Modelagem do Recurso](#modelagem)
4. [Paginação Escalável](#paginacao)
5. [Documentação (OpenAPI 3.0)](#docs)
6. [Conformidade HTTP](#conformidade)
7. [Executando](#executando)
8. [Autor](#autor)

---

## <a name="arquitetura">🧠 Arquitetura e Decisões Técnicas </a>
### 1️⃣ Stack
- Next.js 16 (App Router & Server Components)
- React 19 (Componentes Funcionais & Hooks)
- TypeScript (Strict Mode)
- tRPC v11 (Comunicação RPC totalmente tipada)
- Zod (Validação de esquemas e dados)
- Tailwind CSS v4 (Estilização e Design Neo-Brutalista)

### 2️⃣ Padrões Arquiteturais Aplicados
🔹 Separação de responsabilidades
```markdown
app/                → Páginas, layout global e Server Components (Next.js)
app/components/     → Componentes de interface (Toast, Modal de Confirmação, Popover de Tarefa)
client/             → Cliente tRPC configurado com suporte dinâmico a SSR e Browser
server/             → Roteador tRPC (appRouter), procedimentos e cache de dados
```

### 3️⃣ Error Handling Pattern

Foi implementado um fluxo unificado e centralizado de tratamento de erros tanto no backend quanto no frontend:

- Lançamento de erros estruturados com `TRPCError` no servidor
- Códigos de erro semânticos (`NOT_FOUND`, `BAD_REQUEST`, `INTERNAL_SERVER_ERROR`)
- Captura de exceções e exibição em notificações *Toast* com tempo limite no canto superior central da tela
- Validação reativa no formulário em tempo de digitação, prevenindo envios inválidos

Exemplo de tratamento com `TRPCError`:
```ts
if (!task) {
  throw new TRPCError({
    code: "NOT_FOUND",
    message: "Não foi possível encontrar a tarefa solicitada.",
  });
}
```

Feedback de Erro no Frontend:

- Toast flutuante com tempo limite (auto-dismiss configurável)
- Alertas visuais destacados dentro do formulário e dos modais
- Tratamento de falhas de rede com mensagens amigáveis ao usuário

Esse padrão melhora:
- Manutenibilidade e clareza do código
- Experiência do usuário (UX) com feedback imediato
- Prevenção de travamentos ou falhas silenciosas na aplicação

---

## 🔐 Segurança Aplicada
### ✔ Validação Estrita de Entrada com Zod
```ts
const taskSchema = z.object({
  titulo: z.string().trim().min(1, "O título da tarefa é obrigatório."),
  descricao: z.string().optional(),
});
```

### ✔ Prevenção de Exclusões Acidentais

Proteção contra:
- Cliques acidentais no botão de exclusão
- Perda involuntária de dados importantes
- Modal de confirmação explícito com foco seguro no botão de cancelamento (ESC)

### ✔ Tipagem Estática Ponta a Ponta (Type-Safety)
Controle de:
- Contratos de dados compartilhados entre frontend e backend sem geração de código frágil
- Prevenção de inconsistências entre requisição e resposta em tempo de compilação

---

## <a name="modelagem">📦 Modelagem do Recurso</a>
Cada Tarefa (Task) contém dados bem definidos e tipados:
```json
{
  "id": "uuid-v4",
  "titulo": "string",
  "descricao": "string (opcional)",
  "dataCriacao": "2026-11-03T01:00:00.000Z"
}
```

Motivação:
- `id` → Identificador único universal gerado via UUID
- `titulo` → Campo obrigatório com validação visual interativa
- `descricao` → Detalhamento complementar opcional da tarefa
- `dataCriacao` → Registro cronológico para ordenação e exibição formatada

---

## <a name="paginacao">📄 Paginação Escalável</a>

A listagem suporta paginação por cursor contínuo via procedimento tRPC:
```bash
trpc.taskListPaginated.query({ cursor: 0, limit: 10 })
```

Implementações importantes:
- Paginação baseada em cursor incremental
- Suporte a *Infinite Scroll* com `IntersectionObserver`
- Indicador visual brutalista de carregamento e aviso de fim da lista

Estrutura de resposta consistente:
```json
{
  "tasks": [
    {
      "id": "e4b60e65-27a3-4886-bd76-0f1885b5d5d8",
      "titulo": "Finalizar documentação",
      "descricao": "Revisar tópicos do README",
      "dataCriacao": "2026-11-03T01:00:00.000Z"
    }
  ],
  "nextCursor": 10
}
```

---

## <a name="docs">📖 Documentação (OpenAPI 3.0)</a>

Os contratos de API são autodescritivos e tipados via tRPC e esquemas Zod.

A especificação documenta:
- Procedimentos de Leitura: `taskList`, `taskListPaginated`, `taskById`
- Procedimentos de Mutação: `taskCreate`, `taskUpdate`, `taskDelete`
- Tipos de entrada e saída fortemente tipados
- Mapeamento de códigos de erro e exceções `TRPCError`

Disponível no endpoint:
```bash
http://localhost:3000/api/trpc
```

---

## <a name="conformidade">📊 Conformidade HTTP</a>

Status codes e correspondência semântica tRPC / HTTP:
- 200 → Sucesso na consulta ou mutação (OK)
- 400 → Dados de entrada inválidos / Schema Zod rejeitado (Bad Request)
- 404 → Tarefa não encontrada para edição ou exclusão (Not Found)
- 500 → Erro interno do servidor / Exceção inesperada (Internal Server Error)

---

## <a name="executando">⚙️ Executando</a>

### 🌐 Acesso Online
A aplicação está publicada na Vercel e pode ser acessada diretamente em:
👉 **[https://thmsaguiar-todo-app.vercel.app/](https://thmsaguiar-todo-app.vercel.app/)**

### 💻 Execução Local
Instalar dependências:
```bash
npm install
```

Ambiente de Desenvolvimento:
```bash
npm run dev
```

Compilação de Produção:
```bash
npm run build
```

Verificação de Tipos e Lint:
```bash
npx tsc --noEmit
npm run lint
```

---

## <a name="autor">👨‍💻 Autor</a>

| [<img src="https://github.com/thmsaguiar.png?size=115" width=115><br><sub>@thmsaguiar</sub>](https://github.com/thmsaguiar) |
| :---: |
