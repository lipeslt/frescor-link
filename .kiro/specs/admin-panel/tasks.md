# Implementation Plan: Admin Panel

## Overview

Implementação incremental do painel administrativo em React + TypeScript, reutilizando a infraestrutura existente (authStore, api.ts, React Query, shadcn/ui). Cada tarefa constrói sobre a anterior, terminando com a integração completa de rotas no App.tsx.

## Tasks

- [x] 1. Atualizar authStore para incluir role e isAdmin
  - Instalar `jwt-decode` (`npm install jwt-decode`)
  - Adicionar tipo `Role = "ADMIN" | "USER"` e campos `role: Role | null` e `isAdmin: boolean` à interface `AuthState`
  - Atualizar a action `login` para chamar `jwtDecode<JwtPayload>(accessToken)` e extrair `role`
  - Atualizar `logout` para resetar `role` e `isAdmin` para `null`/`false`
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 1.1 Escrever property test para extração de role do JWT
    - **Property 3: Extração de role do JWT é correta**
    - **Validates: Requirements 1.4**
    - Usar `fast-check` com `fc.constantFrom("ADMIN", "USER")` para verificar que `decodeJwtRole` retorna exatamente o claim `role` do token

- [ ] 2. Criar AdminGuard e adminService.ts
  - [x] 2.1 Criar `src/components/AdminGuard.tsx`
    - Ler `isAuthenticated` e `isAdmin` do `useAuthStore`
    - Se não autenticado → `<Navigate to="/" replace />`
    - Se autenticado mas não admin → toast de acesso negado + `<Navigate to="/" replace />`
    - Se admin → `<Outlet />`
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [ ]* 2.2 Escrever testes unitários para AdminGuard
    - Testar os três estados: não autenticado, autenticado sem ADMIN, autenticado com ADMIN
    - **Property 1: AdminGuard bloqueia acesso sem role ADMIN**
    - **Property 2: AdminGuard permite acesso com role ADMIN**
    - **Validates: Requirements 1.1, 1.2, 1.3**

  - [x] 2.3 Criar `src/services/adminService.ts`
    - Definir interfaces `AdminUser`, `AdminPedido`, `AdminPedidoDetalhe`, `PageResponse<T>` (centralizar)
    - Implementar todos os métodos: `getUsuarios`, `updateUsuarioRole`, `getPedidos`, `getPedidoById`, `updatePedidoStatus`, `getCategorias`, `createCategoria`, `updateCategoria`, `deleteCategoria`, `getProdutos`, `createProduto`, `updateProduto`, `deleteProduto`
    - _Requirements: 3.1–3.4, 4.1–4.4, 5.1, 5.3, 6.1, 6.3_

- [x] 3. Criar AdminLayout com sidebar e header
  - Criar `src/components/admin/AdminLayout.tsx` usando `SidebarProvider` do shadcn/ui
  - Sidebar com links: Dashboard (`/admin/dashboard`), Categorias, Produtos, Usuários, Pedidos — ícones Lucide correspondentes
  - Header com nome e email do admin lidos do `useAuthStore`, botão "Sair" que chama `logout()` e redireciona para `/`
  - Sidebar colapsável em mobile (< 768px) via `useSidebar` hook
  - `<Outlet />` para conteúdo das páginas filhas
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 3.1 Escrever testes unitários para AdminLayout
    - Verificar que todos os 5 links do sidebar estão presentes com hrefs corretos
    - Verificar que nome e email do authStore são exibidos no header
    - Verificar que clique em "Sair" chama `logout`
    - **Property 4: Links do sidebar navegam para rotas corretas**
    - **Property 5: Header exibe dados do usuário autenticado**
    - **Validates: Requirements 2.2, 2.3, 2.4**

- [x] 4. Checkpoint — Garantir que authStore, AdminGuard e AdminLayout compilam sem erros
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

- [x] 5. Implementar página Dashboard (`src/pages/admin/Dashboard.tsx`)
  - Usar `useQuery` para buscar `getPedidos` e `getProdutos` (sem paginação, tamanho grande para métricas)
  - Exibir cards com: total de pedidos, receita total, número de produtos ativos, número de usuários
  - Implementar função `agruparPedidosPorData(pedidos)` para o gráfico de pedidos por período
  - Implementar função `rankingProdutosMaisVendidos(pedidos)` para tabela de top produtos
  - Adicionar filtro de intervalo de datas que recalcula indicadores e gráfico no frontend
  - Exibir `0` ou `N/A` quando dados ausentes (sem propagar erro)
  - Skeleton durante carregamento
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1_

  - [ ]* 5.1 Escrever property tests para funções de agrupamento e ranking
    - **Property 13: Agrupamento de pedidos por data é correto**
    - **Validates: Requirements 7.2**
    - **Property 14: Ranking de produtos mais vendidos é correto**
    - **Validates: Requirements 7.3**
    - **Property 15: Filtro por intervalo de datas exclui pedidos fora do range**
    - **Validates: Requirements 7.4**

- [x] 6. Implementar página Categorias (`src/pages/admin/Categorias.tsx`)
  - [x] 6.1 Listar categorias com paginação
    - `useQuery(["admin", "categorias", { page, size }], ...)` via `adminService.getCategorias`
    - Tabela com shadcn/ui `Table`, skeleton durante `isLoading`
    - Paginação com controles de página
    - _Requirements: 3.1, 8.1_

  - [x] 6.2 Formulário de criação/edição com validação Zod
    - Dialog com React Hook Form + `categoriaSchema` (nome obrigatório, descrição opcional)
    - Validação inline: mensagem abaixo do campo `nome` se vazio
    - Botão submit desabilitado enquanto formulário inválido ou mutação pendente (spinner)
    - _Requirements: 3.6, 8.1_

  - [x] 6.3 Mutations de criar, editar e excluir categoria
    - `useMutation` para POST, PUT e DELETE via `adminService`
    - `onSuccess`: toast de sucesso + `invalidateQueries(["admin", "categorias"])`
    - `onError`: toast de erro com `error.response?.data?.message` ou fallback, manter Dialog aberto
    - AlertDialog de confirmação antes de excluir
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 8.2, 8.3, 8.4_

  - [ ]* 6.4 Escrever property tests para mutações e validação de categorias
    - **Property 6: Mutação CRUD envia request correto e invalida cache**
    - **Validates: Requirements 3.2, 3.3, 3.4, 8.4**
    - **Property 7: Validação de formulário rejeita entradas inválidas**
    - **Validates: Requirements 3.6**

- [ ] 7. Implementar página Produtos (`src/pages/admin/Produtos.tsx`)
  - [x] 7.1 Listar produtos com paginação e filtros
    - `useQuery(["admin", "produtos", { page, size, nome, categoriaId }], ...)` via `adminService.getProdutos`
    - Inputs de filtro por nome e select de categoria (populado com `adminService.getCategorias`)
    - Tabela com skeleton durante `isLoading`
    - _Requirements: 4.1, 4.8, 8.1_

  - [x] 7.2 Formulário de criação/edição com validação Zod
    - Dialog com React Hook Form + `produtoSchema` (nome, preço positivo, estoque inteiro ≥ 0, categoriaId opcional, imagemUrl opcional)
    - Select de categoria populado com dados do backend
    - Validação inline para todos os campos
    - _Requirements: 4.5, 4.6_

  - [x] 7.3 Mutations de criar, editar e excluir produto
    - `useMutation` para POST, PUT e DELETE via `adminService`
    - `onSuccess`: toast de sucesso + `invalidateQueries(["admin", "produtos"])`
    - `onError`: toast de erro, manter Dialog aberto
    - AlertDialog de confirmação antes de excluir
    - _Requirements: 4.2, 4.3, 4.4, 4.7, 8.2, 8.3, 8.4_

  - [ ]* 7.4 Escrever property tests para mutações e validação de produtos
    - **Property 6: Mutação CRUD envia request correto e invalida cache**
    - **Validates: Requirements 4.2, 4.3, 4.4, 8.4**
    - **Property 7: Validação de formulário rejeita entradas inválidas**
    - **Validates: Requirements 4.6**

- [x] 8. Checkpoint — Garantir que Dashboard, Categorias e Produtos funcionam corretamente
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

- [x] 9. Implementar página Usuários (`src/pages/admin/Usuarios.tsx`)
  - `useQuery(["admin", "usuarios", { page, size }], ...)` via `adminService.getUsuarios`
  - Tabela exibindo `id`, `nome`, `email`, `role` e `criadoEm` para cada usuário
  - Select de role por linha com `useMutation` para `updateUsuarioRole`
  - Desabilitar controle de edição quando `usuario.id === authStore.user.id`
  - `onSuccess`: toast de sucesso + `invalidateQueries(["admin", "usuarios"])`
  - `onError`: toast de erro sem alterar estado local
  - Skeleton durante `isLoading`
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.1, 8.2, 8.3, 8.4_

  - [ ]* 9.1 Escrever testes unitários e property tests para Usuários
    - Verificar que todos os campos obrigatórios são exibidos na tabela
    - Verificar que controle de edição está desabilitado para o próprio admin
    - **Property 8: Tabela de usuários exibe todos os campos obrigatórios**
    - **Validates: Requirements 5.2**
    - **Property 9: Admin não pode alterar a própria role**
    - **Validates: Requirements 5.5**
    - **Property 10: Atualização de role envia request correto**
    - **Validates: Requirements 5.3**

- [x] 10. Implementar página Pedidos (`src/pages/admin/Pedidos.tsx`)
  - `useQuery(["admin", "pedidos", { page, size, status }], ...)` via `adminService.getPedidos`
  - Tabela exibindo `id`, nome do usuário, `status`, `total` e `dataPedido`
  - Select de filtro por status que atualiza o query param `status` na requisição
  - Select de status por linha com `useMutation` para `updatePedidoStatus`
  - Ao clicar em uma linha: Sheet/Dialog de detalhes com `useQuery(["admin", "pedido", id])` via `adminService.getPedidoById`, exibindo itens do pedido
  - `onSuccess`: toast de sucesso + `invalidateQueries(["admin", "pedidos"])`
  - `onError`: toast de erro sem alterar estado local
  - Skeleton durante `isLoading`
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 8.1, 8.2, 8.3, 8.4_

  - [ ]* 10.1 Escrever testes unitários e property tests para Pedidos
    - Verificar que todos os campos obrigatórios são exibidos na tabela
    - Verificar que filtro por status envia query param correto
    - **Property 10: Atualização de status envia request correto**
    - **Validates: Requirements 6.3**
    - **Property 11: Tabela de pedidos exibe todos os campos obrigatórios**
    - **Validates: Requirements 6.2**
    - **Property 12: Filtro de pedidos por status envia query param correto**
    - **Validates: Requirements 6.4**

- [x] 11. Integrar rotas admin no App.tsx
  - Importar `AdminGuard`, `AdminLayout` e todas as páginas admin
  - Adicionar bloco de rotas dentro do `<Routes>` existente:
    ```tsx
    <Route element={<AdminGuard />}>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="categorias" element={<Categorias />} />
        <Route path="produtos" element={<Produtos />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="pedidos" element={<Pedidos />} />
      </Route>
    </Route>
    ```
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2_

- [x] 12. Checkpoint final — Garantir que todos os testes passam
  - Garantir que todos os testes passam, perguntar ao usuário se houver dúvidas.

## Notes

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Instalar dependências antes de iniciar: `npm install jwt-decode fast-check`
- Cada tarefa referencia requisitos específicos para rastreabilidade
- Property tests usam `fast-check` com mínimo de 100 iterações (`{ numRuns: 100 }`)
- Query keys seguem o padrão `["admin", "<recurso>", { ...params }]` para invalidação granular
