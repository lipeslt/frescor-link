# Documento de Requisitos

## Introdução

Esta feature corrige e completa a integração do Mercado Pago no fluxo de checkout da aplicação Frescor Link. O diagnóstico do código herdado identificou os seguintes problemas:

- **Backend**: `PaymentService.createPaymentPreference()` salva o `Payment` no banco mas não chama `MercadoPagoClient.createPreference()`. `PaymentService.processWebhookPayment()` está vazio. O endpoint `POST /payments/webhook` está bloqueado pelo `SecurityConfig` (exige JWT).
- **Frontend**: `paymentService.ts` chama `POST /pagamentos/criar-preferencia` (rota inexistente; o controller está em `/payments`). `Checkout.tsx` cria o pedido mas não chama `paymentService` nem redireciona para o `init_point`.

O fluxo completo esperado é: **Checkout → Criar Pedido → Criar Preferência MP → Redirecionar para `init_point` → Retorno → Exibir Status**.

---

## Glossário

- **Checkout**: Página `src/pages/Checkout.tsx` onde o usuário revisa o carrinho e finaliza o pedido.
- **Pedido**: Entidade criada no backend via `POST /pedidos`, representando a intenção de compra.
- **Payment**: Entidade do backend com campos `id`, `mercadoPagoId`, `pedido` (FK), `amount`, `status` (`PaymentStatus`), `paymentMethod`, `createdAt`, `updatedAt`.
- **PaymentStatus**: Enum do backend com valores `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `REFUNDED`.
- **Preferencia_MP**: Objeto criado na API do Mercado Pago via `MercadoPagoClient.createPreference()`, contendo itens, valor e URLs de retorno.
- **init_point**: URL gerada pelo Mercado Pago para redirecionar o usuário ao ambiente de pagamento externo.
- **Payment_Service_Frontend**: Módulo `src/services/paymentService.ts` responsável por chamar os endpoints de pagamento do backend.
- **Payment_Controller**: Controlador Spring Boot que expõe os endpoints `POST /payments`, `GET /payments/{id}`, `GET /payments/pedido/{pedidoId}` e `POST /payments/webhook`.
- **Payment_Service_Backend**: Serviço Spring Boot `PaymentService` que orquestra a criação de preferências e o processamento de webhooks.
- **MercadoPago_Client**: Componente `MercadoPagoClient.java` que chama a API do Mercado Pago com os métodos `createPreference()` e `getPaymentInfo()`.
- **Webhook_Handler**: Endpoint `POST /payments/webhook` do `Payment_Controller` que recebe notificações do Mercado Pago.
- **Pagina_Retorno**: Página frontend `src/pages/PaymentReturn.tsx` acessível em `/pagamento/retorno`.
- **Security_Config**: Classe `SecurityConfig` do Spring Boot que controla autenticação dos endpoints.
- **Order_Service**: Módulo frontend `src/services/orderService.ts` responsável por criar pedidos.

---

## Requisitos

### Requisito 1: Corrigir Endpoint no Payment_Service_Frontend

**User Story:** Como desenvolvedor, quero que o `paymentService.ts` chame o endpoint correto do backend, para que a criação de preferência de pagamento funcione.

#### Critérios de Aceitação

1. THE Payment_Service_Frontend SHALL chamar `POST /payments` para criar uma preferência de pagamento, substituindo a chamada incorreta a `POST /pagamentos/criar-preferencia`.
2. THE Payment_Service_Frontend SHALL enviar no corpo da requisição os campos `pedidoId` (UUID) e `metodo` (String).
3. WHEN o backend retornar HTTP 200, THE Payment_Service_Frontend SHALL expor os campos `initPoint` (String) e `preferenceId` (String) da resposta para o chamador.
4. IF o backend retornar erro HTTP, THEN THE Payment_Service_Frontend SHALL propagar o erro para que o chamador possa tratá-lo.

---

### Requisito 2: Completar o Fluxo de Checkout no Frontend

**User Story:** Como usuário autenticado, quero que ao clicar em "Finalizar Pedido" o sistema crie o pedido e me redirecione para o pagamento no Mercado Pago, para que eu possa concluir a compra.

#### Critérios de Aceitação

1. WHEN o usuário clica em "Finalizar Pedido", THE Checkout SHALL criar o pedido via `Order_Service` antes de qualquer operação de pagamento.
2. WHEN o pedido é criado com sucesso, THE Checkout SHALL chamar o `Payment_Service_Frontend` com o `pedidoId` retornado e o valor total do carrinho.
3. WHEN o `Payment_Service_Frontend` retornar o `initPoint`, THE Checkout SHALL limpar o carrinho via `clearCart()` e redirecionar o navegador para a URL `initPoint`.
4. WHILE o Checkout aguarda resposta do backend, THE Checkout SHALL manter o botão "Finalizar Pedido" desabilitado e exibir o texto "Processando..." para prevenir cliques duplicados.
5. IF o `Order_Service` falhar ao criar o pedido, THEN THE Checkout SHALL exibir um toast de erro e não prosseguir para a criação da preferência.
6. IF o `Payment_Service_Frontend` falhar ao criar a preferência, THEN THE Checkout SHALL exibir um toast de erro com a mensagem recebida do backend e manter o usuário na página de Checkout com o carrinho intacto.

---

### Requisito 3: Completar PaymentService.createPaymentPreference no Backend

**User Story:** Como sistema, quero que a criação de preferência de pagamento chame efetivamente a API do Mercado Pago e retorne o `init_point`, para que o frontend possa redirecionar o usuário.

#### Critérios de Aceitação

1. WHEN `Payment_Service_Backend.createPaymentPreference()` é chamado, THE Payment_Service_Backend SHALL chamar `MercadoPago_Client.createPreference()` com os dados do pedido.
2. THE Payment_Service_Backend SHALL incluir na preferência as URLs de retorno para `success`, `failure` e `pending`, contendo o `pedidoId` como parâmetro de query `external_reference`.
3. WHEN a preferência é criada com sucesso no Mercado Pago, THE Payment_Service_Backend SHALL salvar o `Payment` no banco com `status = PENDING` e o `mercadoPagoId` retornado.
4. WHEN a preferência é criada com sucesso, THE Payment_Service_Backend SHALL retornar o `init_point` e o `preferenceId` para o `Payment_Controller`.
5. IF o `MercadoPago_Client` retornar erro, THEN THE Payment_Service_Backend SHALL lançar uma exceção com a mensagem de erro original para que o `Payment_Controller` retorne HTTP 502.

---

### Requisito 4: Implementar PaymentService.processWebhookPayment no Backend

**User Story:** Como sistema, quero processar as notificações do Mercado Pago e atualizar o status do pedido automaticamente, para que o estado do pedido reflita o resultado real do pagamento.

#### Critérios de Aceitação

1. WHEN `Payment_Service_Backend.processWebhookPayment()` recebe uma notificação do tipo `payment`, THE Payment_Service_Backend SHALL chamar `MercadoPago_Client.getPaymentInfo()` com o `id` recebido na notificação.
2. WHEN o status retornado pelo Mercado Pago for `approved`, THE Payment_Service_Backend SHALL atualizar o `PaymentStatus` do `Payment` correspondente para `APPROVED` no banco de dados.
3. WHEN o status retornado pelo Mercado Pago for `rejected`, THE Payment_Service_Backend SHALL atualizar o `PaymentStatus` do `Payment` correspondente para `REJECTED` no banco de dados.
4. WHEN o status retornado pelo Mercado Pago for `cancelled`, THE Payment_Service_Backend SHALL atualizar o `PaymentStatus` do `Payment` correspondente para `CANCELLED` no banco de dados.
5. WHEN o status retornado pelo Mercado Pago for `in_process` ou `pending`, THE Payment_Service_Backend SHALL manter o `PaymentStatus` do `Payment` como `PENDING` no banco de dados.
6. IF o `Payment` referenciado na notificação não for encontrado no banco de dados, THEN THE Payment_Service_Backend SHALL registrar o erro em log e retornar sem lançar exceção.
7. IF a chamada ao `MercadoPago_Client.getPaymentInfo()` falhar, THEN THE Payment_Service_Backend SHALL lançar uma exceção para que o `Webhook_Handler` retorne HTTP 500 e o Mercado Pago reenvie a notificação.

---

### Requisito 5: Liberar Endpoint de Webhook no Security_Config

**User Story:** Como sistema, quero que o endpoint `POST /payments/webhook` seja acessível sem autenticação JWT, para que o Mercado Pago possa enviar notificações sem credenciais.

#### Critérios de Aceitação

1. THE Security_Config SHALL permitir requisições `POST /payments/webhook` sem autenticação JWT.
2. THE Security_Config SHALL manter a exigência de autenticação JWT para todos os demais endpoints de `/payments/*`.
3. WHEN o Mercado Pago enviar uma requisição `POST /payments/webhook` sem cabeçalho `Authorization`, THE Webhook_Handler SHALL processar a notificação normalmente e retornar HTTP 200.

---

### Requisito 6: Configuração de Ambiente no Backend

**User Story:** Como desenvolvedor, quero que as credenciais e o ambiente do Mercado Pago sejam configurados via variáveis de ambiente, para que eu possa alternar entre sandbox e produção sem alterar o código.

#### Critérios de Aceitação

1. THE Payment_Service_Backend SHALL ler o `ACCESS_TOKEN` do Mercado Pago a partir da variável de ambiente `MERCADOPAGO_ACCESS_TOKEN`, sem nenhum valor hardcoded no código-fonte.
2. THE Payment_Service_Backend SHALL ler o ambiente do Mercado Pago (`sandbox` ou `production`) a partir da propriedade `mercadopago.environment` no `application.properties`.
3. IF a propriedade `mercadopago.environment` não estiver definida, THEN THE Payment_Service_Backend SHALL usar `sandbox` como valor padrão.
4. THE Payment_Controller SHALL retornar HTTP 503 com a mensagem "Serviço de pagamento não configurado" quando o `ACCESS_TOKEN` não estiver definido.

---

### Requisito 7: Criar Página de Retorno do Pagamento

**User Story:** Como usuário, quero ver o resultado do meu pagamento ao retornar do Mercado Pago, para que eu saiba se a transação foi aprovada, pendente ou recusada.

#### Critérios de Aceitação

1. THE Pagina_Retorno SHALL ser acessível na rota `/pagamento/retorno` registrada no `App.tsx`.
2. WHEN o `collection_status` recebido via query param for `approved`, THE Pagina_Retorno SHALL exibir uma mensagem de sucesso com o número do pedido e um botão "Ver meu pedido" que navega para `/pedido/:id`.
3. WHEN o `collection_status` recebido via query param for `pending`, THE Pagina_Retorno SHALL exibir uma mensagem informando que o pagamento está em análise com o número do pedido.
4. WHEN o `collection_status` recebido via query param for `failure`, THE Pagina_Retorno SHALL exibir uma mensagem de falha com o número do pedido e um botão "Tentar novamente" que redireciona para `/checkout`.
5. WHILE a Pagina_Retorno aguarda resposta do backend, THE Pagina_Retorno SHALL exibir um indicador de carregamento.
6. IF os query params `collection_status` ou `external_reference` estiverem ausentes na URL, THEN THE Pagina_Retorno SHALL redirecionar o usuário para a página inicial `/`.

---

### Requisito 8: Documentar Variáveis de Ambiente do Frontend

**User Story:** Como desenvolvedor, quero um arquivo `.env.example` documentado, para que eu saiba quais variáveis de ambiente configurar ao subir o projeto.

#### Critérios de Aceitação

1. THE Checkout SHALL ler a chave pública do Mercado Pago a partir da variável de ambiente `VITE_MP_PUBLIC_KEY`, sem nenhum valor hardcoded no código-fonte.
2. THE Checkout SHALL existir um arquivo `.env.example` na raiz do projeto contendo a variável `VITE_MP_PUBLIC_KEY` documentada com um valor de exemplo.
3. IF a variável `VITE_MP_PUBLIC_KEY` não estiver definida em tempo de execução, THEN THE Checkout SHALL registrar um aviso no console indicando que a chave pública do Mercado Pago não está configurada.
