# Plano de Implementação: mercadopago-checkout

## Visão Geral

Corrigir e completar a integração do Mercado Pago no fluxo de checkout. As tarefas seguem a ordem de dependência real: backend primeiro (serviço de pagamento, webhook, segurança, configuração), depois frontend (serviço, checkout, página de retorno, rota e variáveis de ambiente).

## Tarefas

- [x] 1. Completar `PaymentService.createPaymentPreference()` no backend
  - [x] 1.1 Implementar a chamada ao `MercadoPagoClient.createPreference()` com payload contendo `items`, `back_urls`, `external_reference` (pedidoId) e `notification_url`
    - Buscar o pedido pelo `pedidoId` para obter valor total
    - Montar o payload conforme o modelo de dados do design
    - Chamar `MercadoPagoClient.createPreference(payload)`
    - Salvar `Payment` com `status=PENDING` e `mercadoPagoId` retornado pelo MP
    - Retornar `PaymentResponseDTO(initPoint, preferenceId)`
    - Se `MercadoPagoClient` lançar exceção, propagar para que o controller retorne HTTP 502
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 1.2 Escrever teste de propriedade para `createPaymentPreference` (Propriedade 5)
    - **Propriedade 5: createPaymentPreference delega ao MercadoPagoClient com dados do pedido**
    - **Valida: Requisitos 3.1, 3.2**
    - Usar jqwik com `@ForAll UUID pedidoId` e `@ForAll BigDecimal amount`
    - Verificar que `external_reference` no payload é igual ao `pedidoId` fornecido
    - Verificar que `items[0].unit_price` corresponde ao valor total do pedido

  - [ ]* 1.3 Escrever teste de propriedade para persistência do Payment (Propriedade 6)
    - **Propriedade 6: Payment salvo com status PENDING após criação da preferência**
    - **Valida: Requisitos 3.3**
    - Usar jqwik com `@ForAll String preferenceId` e `@ForAll BigDecimal amount`
    - Verificar que o `Payment` persistido tem `status = PENDING` e `mercadoPagoId` igual ao `id` retornado pelo MP

- [x] 2. Implementar `PaymentService.processWebhookPayment()` no backend
  - [x] 2.1 Implementar o processamento do payload do webhook e atualização de status
    - Parsear o JSON recebido para extrair `type` e `data.id`
    - Se `type != "payment"`, retornar sem ação (HTTP 200)
    - Chamar `MercadoPagoClient.getPaymentInfo(mpPaymentId)`
    - Mapear status MP → `PaymentStatus` conforme tabela do design
    - Buscar `Payment` pelo `mercadoPagoId` e atualizar o status
    - Se `Payment` não encontrado, logar erro e retornar sem exceção
    - Se `getPaymentInfo` falhar, propagar exceção (MP reenviará a notificação)
    - _Requisitos: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [ ]* 2.2 Escrever teste de propriedade para o mapeamento de status (Propriedade 7)
    - **Propriedade 7: Mapeamento de status MP → PaymentStatus é completo e correto**
    - **Valida: Requisitos 4.2, 4.3, 4.4, 4.5**
    - Usar jqwik com `@Provide Arbitrary<String> mpStatuses()` retornando `approved`, `rejected`, `cancelled`, `in_process`, `pending`
    - Verificar mapeamento correto para cada valor

  - [ ]* 2.3 Escrever teste de propriedade para `processWebhookPayment` (Propriedade 8)
    - **Propriedade 8: processWebhookPayment chama getPaymentInfo com o ID correto**
    - **Valida: Requisitos 4.1**
    - Usar jqwik com `@ForAll String mpPaymentId`
    - Verificar que `getPaymentInfo` é chamado com o valor exato de `data.id` do payload

- [x] 3. Liberar endpoint de webhook no `SecurityConfig`
  - [x] 3.1 Adicionar permissão para `POST /payments/webhook` sem autenticação JWT
    - Inserir `requestMatchers(HttpMethod.POST, "/payments/webhook").permitAll()` antes das regras que exigem autenticação
    - Manter todos os demais endpoints de `/payments/*` protegidos por JWT
    - _Requisitos: 5.1, 5.2, 5.3_

  - [ ]* 3.2 Escrever testes unitários para `SecurityConfig`
    - Verificar que `POST /payments/webhook` retorna HTTP 200 sem cabeçalho `Authorization`
    - Verificar que `POST /payments` retorna HTTP 401 sem cabeçalho `Authorization`
    - _Requisitos: 5.1, 5.2_

- [x] 4. Configurar variáveis de ambiente no backend
  - [x] 4.1 Adicionar `mercadopago.environment` no `application.properties`
    - Inserir a propriedade `mercadopago.environment=${MERCADOPAGO_ENVIRONMENT:sandbox}` no arquivo `application.properties`
    - Garantir que `ACCESS_TOKEN` é lido de `MERCADOPAGO_ACCESS_TOKEN` sem valor hardcoded
    - Verificar que `PaymentController` retorna HTTP 503 quando `ACCESS_TOKEN` não está definido
    - _Requisitos: 6.1, 6.2, 6.3, 6.4_

- [x] 5. Checkpoint — Verificar backend
  - Garantir que todos os testes do backend passam. Verificar manualmente que `POST /payments/webhook` não exige JWT. Perguntar ao usuário se há dúvidas antes de prosseguir para o frontend.

- [x] 6. Corrigir `paymentService.ts` no frontend
  - [x] 6.1 Corrigir endpoint e tipagem do `paymentService.ts`
    - Substituir chamada a `POST /pagamentos/criar-preferencia` por `POST /payments`
    - Definir interface `CreatePreferencePayload { pedidoId: string; metodo: string }`
    - Definir interface `PreferenceResponse { initPoint: string; preferenceId: string }`
    - Atualizar assinatura do método para `createPreference(payload: CreatePreferencePayload): Promise<PreferenceResponse>`
    - Propagar erros HTTP para o chamador
    - _Requisitos: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 6.2 Escrever teste de propriedade para o payload do `paymentService` (Propriedade 1)
    - **Propriedade 1: Payload do paymentService contém os campos obrigatórios**
    - **Valida: Requisitos 1.2**
    - Usar fast-check com `fc.uuid()` e `fc.string({ minLength: 1 })`
    - Verificar que `api.post` é chamado com `/payments` e `{ pedidoId, metodo }` exatos

  - [ ]* 6.3 Escrever teste de propriedade para a resposta do `paymentService` (Propriedade 2)
    - **Propriedade 2: Resposta do paymentService expõe initPoint e preferenceId**
    - **Valida: Requisitos 1.3**
    - Usar fast-check com `fc.webUrl()` e `fc.string()`
    - Verificar que o retorno expõe `initPoint` e `preferenceId` acessíveis ao chamador

- [x] 7. Integrar fluxo de pagamento no `Checkout.tsx`
  - [x] 7.1 Atualizar `handleFinalize` para chamar `paymentService` e redirecionar para `initPoint`
    - Após criar o pedido com sucesso, chamar `paymentService.createPreference({ pedidoId: order.id, metodo: "pix" })`
    - Ao receber `initPoint`, chamar `clearCart()` e redirecionar via `window.location.href = initPoint`
    - Remover a chamada a `navigate(`/pedido/${order.id}`)` que existia no fluxo anterior
    - Manter botão desabilitado e texto "Processando..." durante todo o fluxo assíncrono
    - Se `orderService.create()` falhar: exibir toast de erro, não chamar `paymentService`, manter carrinho
    - Se `paymentService.createPreference()` falhar: exibir toast com mensagem do backend, manter carrinho intacto
    - Verificar `VITE_MP_PUBLIC_KEY` e emitir `console.warn` se não estiver definida
    - _Requisitos: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 8.1, 8.3_

  - [ ]* 7.2 Escrever teste de propriedade para o `Checkout` (Propriedade 3)
    - **Propriedade 3: Checkout chama paymentService com o pedidoId correto**
    - **Valida: Requisitos 2.2**
    - Usar fast-check com `fc.uuid()`
    - Verificar que `paymentService.createPreference` recebe `pedidoId` igual ao `id` retornado pelo `orderService`

  - [ ]* 7.3 Escrever teste de propriedade para redirecionamento do `Checkout` (Propriedade 4)
    - **Propriedade 4: Checkout limpa carrinho e redireciona para qualquer initPoint válido**
    - **Valida: Requisitos 2.3**
    - Usar fast-check com `fc.webUrl()`
    - Verificar que `clearCart()` é chamado e `window.location.href` recebe a URL exata sem modificações

  - [ ]* 7.4 Escrever testes unitários para casos de borda do `Checkout`
    - Verificar que falha no `orderService` não chama `paymentService` (Requisito 2.5)
    - Verificar que falha no `paymentService` não chama `clearCart` (Requisito 2.6)
    - Verificar que botão fica desabilitado durante loading (Requisito 2.4)
    - _Requisitos: 2.4, 2.5, 2.6_

- [x] 8. Criar página `PaymentReturn.tsx` e registrar rota
  - [x] 8.1 Criar `src/pages/PaymentReturn.tsx`
    - Ler query params `collection_status`, `external_reference` e `payment_id` via `useSearchParams`
    - Se `collection_status` ou `external_reference` ausentes, redirecionar para `/`
    - Exibir indicador de carregamento enquanto processa os params
    - Para `approved`: mensagem de sucesso + número do pedido + botão "Ver meu pedido" → `/pedido/:id`
    - Para `pending`: mensagem de análise + número do pedido
    - Para `failure` (ou status desconhecido): mensagem de falha + número do pedido + botão "Tentar novamente" → `/checkout`
    - _Requisitos: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 8.2 Registrar rota `/pagamento/retorno` no `App.tsx`
    - Importar `PaymentReturn` e adicionar `<Route path="/pagamento/retorno" element={<PaymentReturn />} />` antes da rota `*`
    - _Requisitos: 7.1_

  - [ ]* 8.3 Escrever testes unitários para `PaymentReturn.tsx`
    - Verificar renderização correta para cada valor de `collection_status` (Requisitos 7.2, 7.3, 7.4)
    - Verificar redirecionamento para `/` quando params ausentes (Requisito 7.6)
    - _Requisitos: 7.2, 7.3, 7.4, 7.6_

- [x] 9. Documentar variáveis de ambiente do frontend
  - [x] 9.1 Criar `.env.example` na raiz do projeto frontend
    - Adicionar `VITE_MP_PUBLIC_KEY=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` com comentário explicativo
    - _Requisitos: 8.2_

- [x] 10. Checkpoint final — Garantir que todos os testes passam
  - Garantir que todos os testes passam. Perguntar ao usuário se há dúvidas antes de encerrar.

## Notas

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- O backend deve ser implementado e validado antes do frontend (dependência real de contrato de API)
- Testes de propriedade usam fast-check (frontend) e jqwik (backend) com mínimo de 100 iterações
- Cada tarefa de propriedade referencia explicitamente a propriedade do design e os requisitos validados
