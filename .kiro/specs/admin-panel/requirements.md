# Requirements Document

## Introduction

O Admin Panel é uma área restrita do frontend frescor-link destinada a usuários com role `ADMIN`. Ele centraliza o gerenciamento operacional do e-commerce: categorias, produtos, usuários, pedidos e relatórios. O painel é acessado via rota `/admin` e utiliza a mesma infraestrutura de autenticação JWT já existente no projeto (authStore + interceptor Axios). A role do usuário é extraída do claim `role` presente no token JWT emitido pelo backend Spring Boot.

---

## Glossary

- **Admin_Panel**: A área restrita do frontend acessível apenas a usuários com role `ADMIN`.
- **Auth_Guard**: Componente de rota que verifica a role do usuário antes de renderizar páginas do Admin_Panel.
- **Category_Manager**: Módulo do Admin_Panel responsável pelo CRUD de categorias.
- **Product_Manager**: Módulo do Admin_Panel responsável pelo CRUD de produtos.
- **User_Manager**: Módulo do Admin_Panel responsável pela visualização e controle de usuários.
- **Order_Manager**: Módulo do Admin_Panel responsável pela visualização e atualização de pedidos.
- **Report_Viewer**: Módulo do Admin_Panel responsável pela exibição de relatórios e métricas.
- **Admin_Service**: Camada de serviço frontend que encapsula as chamadas REST ao backend para operações administrativas.
- **JWT_Token**: Token de autenticação emitido pelo backend com claims `id`, `nome`, `email` e `role`.
- **Backend**: API REST Spring Boot 3.2 com endpoints `/categorias`, `/produtos`, `/pedidos`, `/usuarios`.

---

## Requirements

### Requirement 1: Controle de Acesso ao Painel

**User Story:** Como administrador, quero que o painel de administração seja acessível apenas a usuários autenticados com role `ADMIN`, para que dados sensíveis e operações críticas sejam protegidos.

#### Acceptance Criteria

1. WHEN um usuário autenticado com role `ADMIN` acessa `/admin`, THE Auth_Guard SHALL renderizar o conteúdo do Admin_Panel.
2. WHEN um usuário não autenticado acessa qualquer rota sob `/admin`, THE Auth_Guard SHALL redirecionar o usuário para a página principal `/`.
3. WHEN um usuário autenticado sem role `ADMIN` acessa qualquer rota sob `/admin`, THE Auth_Guard SHALL redirecionar o usuário para a página principal `/` e exibir uma mensagem de acesso negado.
4. THE Auth_Guard SHALL extrair a role do claim `role` do JWT_Token armazenado no authStore sem realizar chamada adicional ao Backend.
5. WHEN o JWT_Token expira durante uma sessão ativa no Admin_Panel, THE Auth_Guard SHALL redirecionar o usuário para a página principal `/` após o logout automático já tratado pelo interceptor Axios.

---

### Requirement 2: Layout e Navegação do Painel

**User Story:** Como administrador, quero um layout consistente com menu lateral e navegação clara entre os módulos, para que eu possa alternar entre as seções do painel com eficiência.

#### Acceptance Criteria

1. THE Admin_Panel SHALL exibir um menu lateral (sidebar) com links para: Dashboard, Categorias, Produtos, Usuários, Pedidos e Relatórios.
2. WHEN o administrador clica em um item do menu lateral, THE Admin_Panel SHALL navegar para a rota correspondente sem recarregar a página.
3. THE Admin_Panel SHALL exibir o nome e email do administrador autenticado no cabeçalho do painel, lidos do authStore.
4. WHEN o administrador clica em "Sair" no cabeçalho, THE Admin_Panel SHALL chamar o método `logout` do authStore e redirecionar para `/`.
5. THE Admin_Panel SHALL ser responsivo, adaptando o menu lateral para um menu colapsável em telas com largura inferior a 768px.

---

### Requirement 3: Gerenciamento de Categorias

**User Story:** Como administrador, quero criar, editar, ativar/desativar e excluir categorias, para que o catálogo de produtos esteja sempre organizado.

#### Acceptance Criteria

1. WHEN o administrador acessa a seção de Categorias, THE Category_Manager SHALL exibir a lista paginada de categorias retornada pelo endpoint `GET /categorias`.
2. WHEN o administrador submete o formulário de criação com `nome` preenchido, THE Category_Manager SHALL enviar uma requisição `POST /categorias` ao Backend e exibir a nova categoria na lista após resposta de sucesso.
3. WHEN o administrador submete o formulário de edição com dados válidos, THE Category_Manager SHALL enviar uma requisição `PUT /categorias/{id}` ao Backend e atualizar a categoria na lista após resposta de sucesso.
4. WHEN o administrador confirma a exclusão de uma categoria, THE Category_Manager SHALL enviar uma requisição `DELETE /categorias/{id}` ao Backend e remover a categoria da lista após resposta de sucesso.
5. IF o Backend retornar erro ao criar, editar ou excluir uma categoria, THEN THE Category_Manager SHALL exibir uma mensagem de erro descritiva ao administrador sem fechar o formulário.
6. THE Category_Manager SHALL validar que o campo `nome` não está vazio antes de submeter o formulário, exibindo mensagem de validação inline.

---

### Requirement 4: Gerenciamento de Produtos

**User Story:** Como administrador, quero criar, editar e excluir produtos com suas informações completas, para que o catálogo reflita o estoque disponível.

#### Acceptance Criteria

1. WHEN o administrador acessa a seção de Produtos, THE Product_Manager SHALL exibir a lista paginada de produtos retornada pelo endpoint `GET /produtos`.
2. WHEN o administrador submete o formulário de criação com `nome`, `preco` e `estoque` preenchidos, THE Product_Manager SHALL enviar uma requisição `POST /produtos` ao Backend e exibir o novo produto na lista após resposta de sucesso.
3. WHEN o administrador submete o formulário de edição com dados válidos, THE Product_Manager SHALL enviar uma requisição `PUT /produtos/{id}` ao Backend e atualizar o produto na lista após resposta de sucesso.
4. WHEN o administrador confirma a exclusão de um produto, THE Product_Manager SHALL enviar uma requisição `DELETE /produtos/{id}` ao Backend e remover o produto da lista após resposta de sucesso.
5. THE Product_Manager SHALL permitir associar um produto a uma categoria existente, exibindo um seletor populado com os dados de `GET /categorias`.
6. THE Product_Manager SHALL validar que `preco` é um número positivo e `estoque` é um inteiro não negativo antes de submeter o formulário, exibindo mensagens de validação inline.
7. IF o Backend retornar erro ao criar, editar ou excluir um produto, THEN THE Product_Manager SHALL exibir uma mensagem de erro descritiva ao administrador sem fechar o formulário.
8. THE Product_Manager SHALL permitir filtrar a lista de produtos por nome e por categoria via parâmetros de query enviados ao endpoint `GET /produtos`.

---

### Requirement 5: Controle de Usuários

**User Story:** Como administrador, quero visualizar todos os usuários cadastrados e alterar suas roles, para que eu possa controlar quem tem acesso administrativo.

#### Acceptance Criteria

1. WHEN o administrador acessa a seção de Usuários, THE User_Manager SHALL exibir a lista paginada de usuários retornada pelo endpoint `GET /usuarios`.
2. THE User_Manager SHALL exibir para cada usuário: `id`, `nome`, `email`, `role` e `criadoEm`.
3. WHEN o administrador altera a role de um usuário e confirma, THE User_Manager SHALL enviar uma requisição `PUT /usuarios/{id}` ao Backend com o novo valor de `role` e atualizar a linha na tabela após resposta de sucesso.
4. IF o Backend retornar erro ao atualizar a role de um usuário, THEN THE User_Manager SHALL exibir uma mensagem de erro descritiva sem alterar o estado local da tabela.
5. THE User_Manager SHALL impedir que o administrador autenticado altere a própria role, desabilitando o controle de edição para o usuário cujo `id` coincide com o `id` do authStore.

---

### Requirement 6: Visualização e Gestão de Pedidos

**User Story:** Como administrador, quero visualizar todos os pedidos e atualizar seus status, para que eu possa acompanhar e gerenciar o fluxo de vendas.

#### Acceptance Criteria

1. WHEN o administrador acessa a seção de Pedidos, THE Order_Manager SHALL exibir a lista paginada de pedidos retornada pelo endpoint `GET /pedidos`.
2. THE Order_Manager SHALL exibir para cada pedido: `id`, nome do usuário, `status`, `total` e `dataPedido`.
3. WHEN o administrador seleciona um novo status para um pedido e confirma, THE Order_Manager SHALL enviar uma requisição `PUT /pedidos/{id}` ao Backend com o novo `status` e atualizar a linha na tabela após resposta de sucesso.
4. THE Order_Manager SHALL permitir filtrar pedidos por `status` via parâmetro de query enviado ao endpoint `GET /pedidos`.
5. IF o Backend retornar erro ao atualizar o status de um pedido, THEN THE Order_Manager SHALL exibir uma mensagem de erro descritiva sem alterar o estado local da tabela.
6. WHEN o administrador clica em um pedido, THE Order_Manager SHALL exibir um painel de detalhes com os itens do pedido retornados pelo endpoint `GET /pedidos/{id}`.

---

### Requirement 7: Relatórios e Métricas

**User Story:** Como administrador, quero visualizar relatórios de vendas e produtos mais vendidos, para que eu possa tomar decisões baseadas em dados.

#### Acceptance Criteria

1. WHEN o administrador acessa a seção de Relatórios, THE Report_Viewer SHALL exibir um dashboard com os seguintes indicadores: total de pedidos, receita total, número de produtos ativos e número de usuários cadastrados.
2. THE Report_Viewer SHALL exibir um gráfico de pedidos por período, agrupando os dados de `GET /pedidos` por data no frontend.
3. THE Report_Viewer SHALL exibir uma tabela com os produtos mais vendidos, derivada da contagem de ocorrências nos itens dos pedidos retornados pelo Backend.
4. WHEN o administrador seleciona um intervalo de datas no filtro de relatório, THE Report_Viewer SHALL recalcular os indicadores e gráficos considerando apenas os pedidos dentro do intervalo selecionado.
5. IF os dados necessários para um indicador não estiverem disponíveis, THEN THE Report_Viewer SHALL exibir o valor `0` ou `N/A` para aquele indicador sem exibir erro ao usuário.

---

### Requirement 8: Feedback e Estados de Carregamento

**User Story:** Como administrador, quero receber feedback visual claro sobre o resultado de cada operação, para que eu saiba se uma ação foi concluída com sucesso ou falhou.

#### Acceptance Criteria

1. WHILE uma requisição ao Backend está em andamento, THE Admin_Panel SHALL exibir um indicador de carregamento (skeleton ou spinner) na área de conteúdo correspondente.
2. WHEN uma operação de criação, edição ou exclusão é concluída com sucesso, THE Admin_Panel SHALL exibir uma notificação toast de sucesso com descrição da ação realizada.
3. WHEN uma operação falha por erro do Backend, THE Admin_Panel SHALL exibir uma notificação toast de erro com a mensagem retornada pelo Backend ou uma mensagem genérica de fallback.
4. THE Admin_Panel SHALL invalidar o cache do React Query após cada operação de mutação bem-sucedida, garantindo que as listas reflitam o estado atual do Backend.
