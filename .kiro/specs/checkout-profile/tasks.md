# Tasks — checkout-profile

## Task List

- [x] 1. Estender serviços existentes
  - [x] 1.1 Adicionar `getByUser(usuarioId)` ao `orderService` chamando `GET /pedidos/usuario/{usuarioId}`
  - [x] 1.2 Adicionar `getPaymentStatus(pedidoId)` ao `paymentService` chamando `GET /payments/pedido/{pedidoId}`
  - [x] 1.3 Adicionar interface `OrderItem` e campo `itens?: OrderItem[]` ao `PedidoResponse` em `orderService.ts`
  - [x] 1.4 Adicionar interface `PaymentStatusResponse` ao `paymentService.ts`

- [x] 2. Criar componente PaymentBrick
  - [x] 2.1 Criar `src/components/PaymentBrick.tsx` com props `preferenceId`, `publicKey`, `onSuccess`, `onPending`, `onError`
  - [x] 2.2 Implementar `useEffect` que inicializa o SDK via `initMercadoPago(publicKey)` e monta o Brick no `div#payment-brick-container`
  - [x] 2.3 Implementar cleanup do `useEffect` chamando `unmount()` na instância do Brick
  - [x] 2.4 Exibir spinner de carregamento enquanto o Brick não está pronto
  - [x] 2.5 Propagar erros do Brick via callback `onError`

- [x] 3. Atualizar Checkout.tsx para usar Payment Brick
  - [x] 3.1 Adicionar estado `step: 'cart' | 'payment'`, `orderId` e `preferenceId`
  - [x] 3.2 Remover o `window.location.href = initPoint` do fluxo atual
  - [x] 3.3 No `handleFinalize`: criar pedido → criar preferência → `setStep('payment')`
  - [x] 3.4 Renderizar `<PaymentBrick>` quando `step === 'payment'` e `preferenceId` estiver definido
  - [x] 3.5 Implementar `onSuccess` e `onPending`: `clearCart()` + `navigate('/pedido/${orderId}')`
  - [x] 3.6 Implementar `onError`: exibir toast com mensagem de erro, manter carrinho
  - [x] 3.7 Exibir mensagem de erro se `VITE_MP_PUBLIC_KEY` não estiver definida

- [x] 4. Criar página Perfil
  - [x] 4.1 Criar `src/pages/Perfil.tsx` com rota `/perfil`
  - [x] 4.2 Implementar guard de autenticação: redirecionar para `/` se não autenticado
  - [x] 4.3 Exibir seção de dados do usuário (nome e email do AuthStore, read-only)
  - [x] 4.4 Implementar seção de histórico de pedidos chamando `orderService.getByUser(user.id)`
  - [x] 4.5 Exibir skeleton loading enquanto pedidos carregam
  - [x] 4.6 Exibir mensagem de erro com botão "Tentar novamente" se a requisição falhar
  - [x] 4.7 Exibir mensagem de lista vazia com botão para explorar produtos
  - [x] 4.8 Exibir cada pedido com: número, data formatada `dd/MM/yyyy`, valor total `R$ X,XX`, badge de Order_Status

- [x] 5. Implementar detalhe de pedido inline no Perfil
  - [x] 5.1 Ao clicar em um pedido, chamar `orderService.getById(id)` e exibir detalhe expandido
  - [x] 5.2 Exibir lista de itens com nome, quantidade e preço unitário
  - [x] 5.3 Chamar `paymentService.getPaymentStatus(pedidoId)` e exibir badge de Payment_Status
  - [x] 5.4 Implementar mapeamento de Payment_Status para label PT-BR e cor de badge
  - [x] 5.5 Exibir mensagem de erro descritiva se o detalhe falhar ao carregar

- [x] 6. Adicionar rota /perfil no App.tsx
  - [x] 6.1 Importar `Perfil` de `src/pages/Perfil.tsx`
  - [x] 6.2 Adicionar `<Route path="/perfil" element={<Perfil />} />` nas rotas

- [x] 7. Adicionar link para /perfil no Header
  - [x] 7.1 Adicionar link "Meu Perfil" no `Header.tsx` visível apenas para usuários autenticados

- [x] 8. Testes
  - [x] 8.1 Escrever testes unitários para `formatDate` (null, inválido, válido)
  - [x] 8.2 Escrever testes unitários para `formatCurrency`
  - [x] 8.3 Escrever testes unitários para `getPaymentStatusConfig` (todos os status + fallback)
  - [x] 8.4 [PBT] Escrever property test P2: carrinho limpo após approved/pending (fast-check, 100 iterações)
    - `// Feature: checkout-profile, Property 2: Carrinho limpo após pagamento bem-sucedido`
  - [x] 8.5 [PBT] Escrever property test P3: erro não limpa carrinho (fast-check, 100 iterações)
    - `// Feature: checkout-profile, Property 3: Erro no Brick não limpa o carrinho`
  - [x] 8.6 [PBT] Escrever property test P4: formatDate para datas ISO válidas (fast-check, 100 iterações)
    - `// Feature: checkout-profile, Property 4: Formatação de data é sempre válida`
  - [x] 8.7 [PBT] Escrever property test P5: formatCurrency para floats >= 0 (fast-check, 100 iterações)
    - `// Feature: checkout-profile, Property 5: Formatação de valor monetário`
  - [x] 8.8 [PBT] Escrever property test P6: badge de Payment_Status é determinístico (fast-check, 100 iterações)
    - `// Feature: checkout-profile, Property 6: Badge de Payment_Status é determinístico`
