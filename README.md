# Catálogo de Produtos

O Catálogo de Produtos é uma aplicação web projetada para exibir e gerenciar um catálogo de produtos de forma simples e eficiente. A plataforma oferece uma interface pública para visualização de produtos e uma área administrativa para gerenciamento de conteúdo.

## 1. Stack Tecnológica

- **Frontend:**
  - **Framework:** React com Vite
  - **Linguagem:** TypeScript
  - **Estilização:** Tailwind CSS
  - **Componentes:** shadcn/ui
- **Backend:**
  - **Framework:** Express.js
  - **Linguagem:** TypeScript
  - **Banco de Dados:** PostgreSQL
  - **ORM:** Prisma
- **Validação de Schema:** Zod (compartilhado entre front e back)

## 2. Como Iniciar o Projeto

### Pré-requisitos

- Node.js (v18 ou superior)
- npm

### Passos para Instalação

1.  **Clonar o repositório:**
    ```bash
    git clone <url-do-repositorio>
    cd EcommerceCatalog
    ```

2.  **Instalar as dependências:**
    ```bash
    npm install
    ```

3.  **Configurar as variáveis de ambiente:**
    - Crie um arquivo `.env` na raiz do projeto e adicione as seguintes variáveis:
      ```
      DATABASE_URL="postgresql://user:password@host:port/database"
      SESSION_SECRET="your-secret-key"
      ADMIN_CODE="your-admin-code"
      PORT=5000
      SUPABASE_URL="your-supabase-url"
      SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
      SUPABASE_ANON_KEY="your-supabase-anon-key"
      ```

4.  **Aplicar as migrações do banco de dados:**
    ```bash
    npx prisma migrate dev
    ```

5.  **Iniciar a aplicação em modo de desenvolvimento:**
    ```bash
    npm run dev
    ```

A aplicação estará disponível localmente. O servidor backend rodará na porta especificada na variável `PORT` (padrão: 5000) e o frontend será servido pelo Vite, geralmente em uma porta como `5173`.

### Outros Scripts

- **`npm run build`**: Compila o frontend e o backend para produção.
- **`npm run start`**: Inicia a aplicação em modo de produção (após o build).
- **`npm run check`**: Executa a verificação de tipos do TypeScript.

## 3. Fluxos da Aplicação e Rotas

### 3.1. Fluxo de Visualização de Produtos

- **Página Frontend:** `/` (Página de Destaques), `/search` (Página de Busca)
- **Rotas de API relacionadas:**
  - `GET /api/stacks`: Busca as stacks de produtos para a página de destaques.
  - `GET /api/products`: Busca os produtos com paginação para a página de busca.

```mermaid
graph TD
    subgraph "Página: / (Destaques)"
        A[Usuário acessa a página inicial] --> B[Carregamento de dados];
        B --> C[GET /api/stacks];
        C --> D[Exibe as stacks de produtos];
    end

    subgraph "Página: /search (Busca)"
        E[Usuário acessa a página de busca] --> F[Carregamento de dados];
        F --> G[GET /api/products];
        G --> H[Exibe a lista de produtos com paginação];
        H --> I{Usuário utiliza a busca};
        I -- Digita no campo de busca --> J[GET /api/products?q=...];
        J --> H;
    end
```

### 3.2. Fluxo de Login do Administrador

- **Página Frontend:** `/admin`
- **Rotas de API relacionadas:**
  - `POST /api/admin/login`: Autentica o administrador.

```mermaid
graph TD
    subgraph Fluxo de Login do Admin
        A[Usuário acessa a página /admin] --> B[Página de login é exibida];
        B -- Insere o código de acesso e envia --> C[POST /api/admin/login];
        C -- Sucesso --> D[Redireciona para o dashboard de administração];
        C -- Erro --> E[Exibe mensagem de erro];
    end
```

### 3.3. Fluxo de Gerenciamento de Produtos e Stacks (Área Administrativa)

- **Página Frontend:** `/admin/dashboard`
- **Rotas de API relacionadas:**
  - `GET /api/products`: Busca todos os produtos.
  - `GET /api/stacks`: Busca todas as stacks.
  - `PUT /api/products/:id`: Atualiza um produto.
  - `PUT /api/stacks/:id`: Atualiza uma stack.
  - `POST /api/products`: Cria um novo produto.
  - `POST /api/stacks`: Cria uma nova stack.
  - `DELETE /api/products/:id`: Deleta um produto.
  - `DELETE /api/stacks/:id`: Deleta uma stack.

```mermaid
graph TD
    subgraph Página: /admin/dashboard
        A[Admin acessa o dashboard] --> B[Carregamento de dados];
        B --> C[GET /api/products];
        B --> D[GET /api/stacks];
        C --> E[Exibe a lista de produtos];
        D --> F[Exibe a lista de stacks];

        subgraph Gerenciamento de Produtos
            G[Admin clica em Editar Produto] --> H[Abre o modal de edição de produto];
            H -- Modifica os dados e salva --> I[PUT /api/products/:id];
            I -- Sucesso --> J[Atualiza a lista de produtos];
        end

        subgraph Gerenciamento de Stacks
            K[Admin clica em Editar Stack] --> L[Abre o modal de edição de stack];
            L -- Modifica os dados e salva --> M[PUT /api/stacks/:id];
            M -- Sucesso --> N[Atualiza a lista de stacks];
        end
    end
```

## 4. Endpoints da API

| Método | Rota                  | Descrição                                         |
|--------|-----------------------|---------------------------------------------------|
| GET    | /api/products         | Retorna uma lista de produtos com paginação.      |
| GET    | /api/products/:id     | Retorna um único produto.                         |
| POST   | /api/products         | Cria um novo produto.                             |
| PUT    | /api/products/:id     | Atualiza um produto existente.                    |
| DELETE | /api/products/:id     | Deleta um produto.                                |
| GET    | /api/stacks           | Retorna uma lista de stacks.                      |
| GET    | /api/stacks/:id       | Retorna uma única stack.                          |
| POST   | /api/stacks           | Cria uma nova stack.                              |
| PUT    | /api/stacks/:id       | Atualiza uma stack existente.                     |
| DELETE | /api/stacks/:id       | Deleta uma stack.                                 |
| POST   | /api/admin/login      | Autentica o administrador.                        |

## 5. Estrutura do Projeto

```
/
├── client/         # Código do frontend (React/Vite)
│   ├── src/
│   │   ├── components/ # Componentes React reutilizáveis (shadcn/ui)
│   │   ├── pages/      # Componentes de página (um por rota)
│   │   └── App.tsx     # Definição das rotas
├── server/         # Código do backend (Node.js/Express)
│   ├── db.ts         # Configuração do banco de dados com Prisma
│   ├── index.ts      # Ponto de entrada do servidor Express
│   ├── routes.ts     # Definição das rotas da API
│   └── storage.ts    # Funções de acesso ao banco de dados
├── prisma/         # Schema e migrações do Prisma
│   └── schema.prisma
├── shared/         # Código compartilhado entre frontend e backend
│   └── schema.ts     # Schemas do Zod para validação
└── README.md       # Esta documentação
```

## 6. Contribuição

Contribuições são bem-vindas! Se você encontrar um bug ou tiver uma sugestão de melhoria, por favor, abra uma issue no repositório do GitHub. Se você quiser contribuir com código, por favor, crie um fork do repositório e envie um pull request.

## 7. Deployment

Para fazer o deploy da aplicação, você pode seguir os seguintes passos:

1.  **Faça o build do projeto:**
    ```bash
    npm run build
    ```
2.  **Inicie a aplicação em modo de produção:**
    ```bash
    npm run start
    ```

Certifique-se de que as variáveis de ambiente estão configuradas no ambiente de produção.