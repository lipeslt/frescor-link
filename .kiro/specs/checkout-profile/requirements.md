# Requirements Document

## Introduction

Esta feature adiciona duas capacidades ao frontend frescor-link-novo:

1. **Pagamento embutido via Mercado Pago Bricks** — o Payment Brick é renderizado dentro da página `/checkout`, eliminando o redirecionamento para o site do Mercado Pago. O pedido é criado com status `AGUARDANDO_PAGAMENTO` e só avança após confirmação do pagamento.

2. **Página de perfil do usuário** (`/perfil`) — exibe dados do usuário autenticado e histórico de pedidos com status de pagamento. O detalhe de cada pedido (itens, valor, status) fica dentro da própria página `/meus-pedidos`.

O backend já expõe os endpoints necessários:
- `POST /payments` → `{ initPoint, preferenceId }`
- `GET /pedidos/usuario/{usuarioId}` → lista de pedidos do usuário
- `GET /pedidos/{id}` → detalhe do pedido
- `GET /payments/pedido/{pedidoId}` → status do pagamento

---

## Glossary

- **Payment_Brick**: Componente do SDK `@mercadopago/sdk-js` que renderiza o formulário de pagamento embutido na página.
- **Checkout_Page**: Página `/checkout` do frontend onde o usuário revisa o carrinho e realiza o pagamento.
- **Profile_Page**: Página `/perfil` do frontend com dados do usuário e histórico de pedidos.
- **Order**: Pedido criado no backend com campos `id`, `status`, `valorTotal`, `dataCriacao`, `itens[]`.
- **Payment**: Registro de pagamento com campos `id`, `status`, `mercadoPagoId`, `amount`.
- **Order_Status**: Enum do backend — `AGUARDANDO_PAGAMENTO`, `PAGO`, `SEPARACAO_ESTOQUE`, `ENVIADO`, `ENTREGUE`, `CANCELADO`.
- **Payment_Status**: Enum do backend — `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `REFUNDED`.
- **AuthStore**: Store Zustand que mantém `user { id, nome, email }`, `accessToken`, `isAuthenticated`, `isAdmin`.
- **OrderService**: Módulo de serviço que encapsula chamadas HTTP aos endpoints de pedidos.
- **PaymentService**: Módulo de serviço que encapsula chamadas HTTP aos endpoints de pagamento.

---

## Requirements

### Requirement 1: Inicialização do Payment Brick no Checkout

**User Story:** Como cliente autenticado, quero que o formulário de pagamento apareça diretamente na página de checkout, para que eu não precise sair do site para pagar.

#### Acceptance Criteria

1. WHEN o usuário acessa `/checkout` com itens no carrinho e está autenticado, THE Checkout_Page SHALL renderizar o Payment Brick usando a chave pública `VITE_MP_PUBLIC_KEY` do ambiente.
2. WHEN o Payment Brick é inicializado, THE Checkout_Page SHALL exibir um indicador de carregamento até que o componente esteja pronto para interação.
3. IF `VITE_MP_PUBLIC_KEY` não estiver definida no ambiente, THEN THE Checkout_Page SHALL exibir uma mensagem de erro informando que o pagamento não está disponível no momento.
4. IF o usuário não estiver autenticado ao acessar `/checkout`, THEN THE Checkout_Page SHALL exibir uma mensagem solicitando login antes de renderizar o Payment Brick.

---

### Requirement 2: Criação do Pedido antes do Pagamento

**User Story:** Como cliente, quero que meu pedido seja registrado antes de eu pagar, para que o sistema reserve minha compra enquanto processo o pagamento.

#### Acceptance Criteria

1. WHEN o usuário confirma o checkout, THE Checkout_Page SHALL chamar `POST /pedidos` com `usuarioId` e `valorTotal` antes de inicializar o Payment Brick.
2. WHEN o pedido é criado com sucesso, THE OrderService SHALL retornar um `Order` com `status` igual a `AGUARDANDO_PAGAMENTO`.
3. WHEN o pedido é criado com sucesso, THE Checkout_Page SHALL chamar `POST /payments` com o `pedidoId` retornado para obter o `preferenceId`.
4. IF a criação do pedido falhar, THEN THE Checkout_Page SHALL exibir uma mensagem de erro descritiva e manter o carrinho intacto.
5. IF a criação da preferência de pagamento falhar, THEN THE Checkout_Page SHALL exibir uma mensagem de erro descritiva e manter o pedido criado para reprocessamento.

---

### Requirement 3: Submissão e Resultado do Pagamento via Brick

**User Story:** Como cliente, quero receber feedback imediato sobre o resultado do meu pagamento sem sair da página, para que eu saiba se minha compra foi concluída.

#### Acceptance Criteria

1. WHEN o Payment Brick emite o callback `onSubmit` com status `approved`, THE Checkout_Page SHALL limpar o carrinho e redirecionar o usuário para `/pedido/{pedidoId}`.
2. WHEN o Payment Brick emite o callback `onSubmit` com status `pending`, THE Checkout_Page SHALL limpar o carrinho e redirecionar o usuário para `/pedido/{pedidoId}` com indicação de pagamento em análise.
3. WHEN o Payment Brick emite o callback `onError`, THE Checkout_Page SHALL exibir a mensagem de erro retornada pelo Brick sem redirecionar o usuário.
4. WHEN o pagamento é concluído com sucesso, THE Checkout_Page SHALL destruir a instância do Payment Brick para liberar recursos.
5. IF o usuário fechar ou navegar para fora da página durante o pagamento, THEN THE Checkout_Page SHALL destruir a instância do Payment Brick.

---

### Requirement 4: Página de Perfil do Usuário

**User Story:** Como usuário autenticado, quero acessar uma página de perfil em `/perfil`, para que eu possa visualizar meus dados cadastrais e histórico de compras em um único lugar.

#### Acceptance Criteria

1. THE Profile_Page SHALL ser acessível na rota `/perfil` apenas para usuários autenticados.
2. IF um usuário não autenticado acessar `/perfil`, THEN THE Profile_Page SHALL redirecionar para `/` com uma mensagem informando que é necessário fazer login.
3. WHEN um usuário autenticado acessa `/perfil`, THE Profile_Page SHALL exibir `nome` e `email` do usuário obtidos do AuthStore.
4. THE Profile_Page SHALL conter uma seção de histórico de pedidos e uma seção de dados do usuário, navegáveis por abas ou seções distintas.

---

### Requirement 5: Histórico de Pedidos no Perfil

**User Story:** Como usuário autenticado, quero ver todos os meus pedidos na página de perfil, para que eu possa acompanhar o status de cada compra.

#### Acceptance Criteria

1. WHEN o usuário acessa a seção de pedidos em `/perfil`, THE Profile_Page SHALL chamar `GET /pedidos/usuario/{usuarioId}` usando o `id` do AuthStore.
2. WHEN a lista de pedidos é carregada, THE Profile_Page SHALL exibir para cada pedido: número do pedido, data de criação formatada em `dd/MM/yyyy`, valor total formatado em `R$ X,XX` e badge com o Order_Status traduzido para português.
3. WHILE os pedidos estão sendo carregados, THE Profile_Page SHALL exibir esqueletos de carregamento no lugar dos itens da lista.
4. IF a requisição de pedidos falhar, THEN THE Profile_Page SHALL exibir uma mensagem de erro com opção de tentar novamente.
5. IF o usuário não tiver pedidos, THEN THE Profile_Page SHALL exibir uma mensagem informando que nenhum pedido foi encontrado e um botão para explorar produtos.

---

### Requirement 6: Detalhe do Pedido no Perfil

**User Story:** Como usuário autenticado, quero visualizar os detalhes de um pedido específico, para que eu possa conferir os itens comprados e o status do pagamento.

#### Acceptance Criteria

1. WHEN o usuário clica em um pedido na lista, THE Profile_Page SHALL exibir o detalhe do pedido chamando `GET /pedidos/{id}`.
2. WHEN o detalhe do pedido é carregado, THE Profile_Page SHALL exibir: lista de itens com nome, quantidade e preço unitário; valor total; Order_Status com badge colorido; e data de criação.
3. WHEN o detalhe do pedido é carregado, THE Profile_Page SHALL chamar `GET /payments/pedido/{pedidoId}` e exibir o Payment_Status correspondente.
4. IF o Payment_Status for `PENDING`, THEN THE Profile_Page SHALL exibir um badge amarelo com o texto "Aguardando pagamento".
5. IF o Payment_Status for `APPROVED`, THEN THE Profile_Page SHALL exibir um badge verde com o texto "Pago".
6. IF o Payment_Status for `REJECTED` ou `CANCELLED`, THEN THE Profile_Page SHALL exibir um badge vermelho com o texto correspondente ao status.
7. IF a requisição de detalhe do pedido falhar, THEN THE Profile_Page SHALL exibir uma mensagem de erro descritiva.

---

### Requirement 7: Exibição de Dados do Usuário no Perfil

**User Story:** Como usuário autenticado, quero ver meus dados cadastrais na página de perfil, para que eu possa confirmar minhas informações.

#### Acceptance Criteria

1. WHEN o usuário autenticado acessa `/perfil`, THE Profile_Page SHALL exibir o `nome` e `email` do usuário obtidos do AuthStore (read-only).
2. THE Profile_Page SHALL exibir os dados do usuário em uma seção separada do histórico de pedidos.

---

### Requirement 8: Integração do SDK Mercado Pago

**User Story:** Como desenvolvedor, quero que o SDK do Mercado Pago seja inicializado de forma segura e reutilizável, para que o Payment Brick funcione corretamente em qualquer contexto de pagamento.

#### Acceptance Criteria

1. THE PaymentService SHALL inicializar o SDK `@mercadopago/sdk-js` uma única vez por sessão usando a chave pública `VITE_MP_PUBLIC_KEY`.
2. WHEN o SDK é inicializado, THE PaymentService SHALL expor um método para criar e montar uma instância do Payment Brick em um elemento DOM identificado por `id`.
3. WHEN o Payment Brick é desmontado, THE PaymentService SHALL chamar o método `unmount` da instância para liberar recursos do SDK.
4. IF o SDK falhar ao inicializar, THEN THE PaymentService SHALL lançar um erro descritivo que permita ao componente consumidor exibir feedback adequado ao usuário.
