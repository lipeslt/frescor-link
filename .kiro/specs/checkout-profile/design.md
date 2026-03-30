# Design Document — checkout-profile

## Overview

Esta feature substitui o fluxo de redirect do Mercado Pago por um Payment Brick embutido na página `/checkout`, e adiciona a página `/perfil` com dados do usuário e histórico de pedidos com detalhe inline.

Fluxo principal do checkout:
1. Usuário revisa o carrinho em `/checkout`
2. Clica em "Finalizar Pedido" → frontend cria o pedido via `POST /pedidos`
3. Frontend chama `POST /payments` para obter `preferenceId`
4. Payment Brick é montado no DOM usando o `preferenceId`
5. Usuário paga dentro da própria página
6. Callback `onSubmit` do Brick → limpa carrinho → redireciona para `/pedido/{id}`

Fluxo da página de perfil:
1. Usuário acessa `/perfil` (autenticado)
2. Dados do usuário exibidos do AuthStore (read-only)
3. Lista de pedidos carregada via `GET /pedidos/usuario/{usuarioId}`
4. Clique em pedido → detalhe expandido inline com status de pagamento via `GET /payments/pedido/{pedidoId}`

---

## Architecture

```mermaid
graph TD
    A[Checkout.tsx] -->|1. POST /pedidos| B[orderService.create]
    A -->|2. POST /payments| C[paymentService.createPreference]
    A -->|3. monta Brick| D[PaymentBrick.tsx]
    D -->|usa SDK| E[@mercadopago/sdk-js]
    E -->|onSubmit approved/pending| A
    A -->|clearCart + navigate| F[/pedido/:id]

    G[Perfil.tsx] -->|GET /pedidos/usuario/:id| H[orderService.getByUser]
    G -->|GET /pedidos/:id| I[orderService.getById]
    G -->|GET /payments/pedido/:id| J[paymentService.getPaymentStatus]
    G -->|lê AuthStore| K[useAuthStore]
```

Decisões de arquitetura:
- `PaymentBrick.tsx` é um componente wrapper isolado que encapsula toda a lógica do SDK MP. O `Checkout.tsx` apenas passa `preferenceId` e callbacks.
- O SDK é inicializado dentro do `PaymentBrick` via `useEffect`, garantindo uma única instância por montagem.
- `Perfil.tsx` usa estado local para o pedido selecionado (sem rota separada), conforme decisão do usuário.
- `orderService` ganha o método `getByUser(usuarioId)` que chama `GET /pedidos/usuario/{usuarioId}`.
- `paymentService` ganha o método `getPaymentStatus(pedidoId)` que chama `GET /payments/pedido/{pedidoId}`.

---

## Components and Interfaces

### PaymentBrick.tsx

```typescript
interface PaymentBrickProps {
  preferenceId: string;
  publicKey: string;
  onSuccess: (pedidoId: string) => void;
  onPending: (pedidoId: string) => void;
  onError: (error: unknown) => void;
}
```

Responsabilidades:
- Carrega o script do SDK via `initMercadoPago(publicKey)`
- Monta o Brick no `div#payment-brick-container`
- Chama `onSuccess` quando `onSubmit` retorna status `approved`
- Chama `onPending` quando `onSubmit` retorna status `pending`
- Chama `onError` em qualquer erro do Brick
- Destrói a instância no `useEffect` cleanup (unmount)

### Checkout.tsx (atualizado)

Estado adicionado:
```typescript
const [step, setStep] = useState<'cart' | 'payment'>('cart');
const [orderId, setOrderId] = useState<string | null>(null);
const [preferenceId, setPreferenceId] = useState<string | null>(null);
```

Fluxo:
- `step === 'cart'`: exibe resumo do carrinho + botão "Finalizar Pedido"
- Ao clicar: cria pedido → cria preferência → `setStep('payment')`
- `step === 'payment'`: renderiza `<PaymentBrick>` no lugar do botão

### Perfil.tsx (novo)

```typescript
interface OrderDetail extends PedidoResponse {
  itens?: OrderItem[];
  valorTotal?: number;
}

interface PaymentStatus {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'REFUNDED';
  mercadoPagoId?: string;
  amount?: number;
}
```

Estado:
```typescript
const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
const [detailLoading, setDetailLoading] = useState(false);
```

### orderService (extensão)

```typescript
getByUser: (usuarioId: string) =>
  api.get<PedidoResponse[]>(`/pedidos/usuario/${usuarioId}`)
```

### paymentService (extensão)

```typescript
getPaymentStatus: (pedidoId: string) =>
  api.get<PaymentStatus>(`/payments/pedido/${pedidoId}`)
```

---

## Data Models

### OrderItem

```typescript
interface OrderItem {
  id: string;
  produtoId: string;
  nomeProduto: string;
  quantidade: number;
  precoUnitario: number;
}
```

### PedidoResponse (extensão)

```typescript
interface PedidoResponse {
  id: string;
  usuario: { id: string; nome: string; email: string };
  status: string;           // Order_Status enum
  valorTotal?: number;
  dataPedido?: string;
  createdAt?: string;
  itens?: OrderItem[];
}
```

### PaymentStatusResponse

```typescript
interface PaymentStatusResponse {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'REFUNDED';
  mercadoPagoId?: string;
  amount?: number;
}
```

### Mapeamentos de status

Order_Status → label PT-BR + cor badge:
```
AGUARDANDO_PAGAMENTO → "Aguardando pagamento" (amarelo)
PAGO                 → "Pago"                 (verde)
SEPARACAO_ESTOQUE    → "Em separação"         (azul)
ENVIADO              → "Enviado"              (azul)
ENTREGUE             → "Entregue"             (verde)
CANCELADO            → "Cancelado"            (vermelho)
```

Payment_Status → label PT-BR + cor badge:
```
PENDING   → "Aguardando pagamento" (amarelo)
APPROVED  → "Pago"                 (verde)
REJECTED  → "Recusado"             (vermelho)
CANCELLED → "Cancelado"            (vermelho)
REFUNDED  → "Reembolsado"          (cinza)
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Brick só é montado após pedido e preferência criados

*For any* checkout com carrinho não-vazio e usuário autenticado, o componente `PaymentBrick` só deve ser renderizado após `orderId` e `preferenceId` estarem definidos no estado do `Checkout`.

**Validates: Requirements 2.1, 2.3**

---

### Property 2: Carrinho limpo após pagamento bem-sucedido

*For any* carrinho com N itens, após o callback `onSubmit` do Brick retornar status `approved` ou `pending`, o carrinho deve conter 0 itens.

**Validates: Requirements 3.1, 3.2**

---

### Property 3: Erro no Brick não limpa o carrinho

*For any* carrinho com N itens, após o callback `onError` do Brick ser disparado, o carrinho deve continuar com os mesmos N itens.

**Validates: Requirements 3.3**

---

### Property 4: Formatação de data é sempre válida

*For any* string de data ISO 8601 válida, a função de formatação deve retornar uma string no formato `dd/MM/yyyy`; para entradas inválidas ou nulas, deve retornar `"—"`.

**Validates: Requirements 5.2**

---

### Property 5: Formatação de valor monetário

*For any* número de ponto flutuante representando um valor em reais, a função de formatação deve retornar uma string no formato `R$ X,XX` com duas casas decimais.

**Validates: Requirements 5.2**

---

### Property 6: Badge de Payment_Status é determinístico

*For any* valor de `Payment_Status`, a função de mapeamento deve retornar exatamente um label e uma classe de cor, sem retornar `undefined`.

**Validates: Requirements 6.4, 6.5, 6.6**

---

### Property 7: Perfil redireciona usuário não autenticado

*For any* acesso à rota `/perfil` sem autenticação, o componente deve redirecionar para `/` sem renderizar dados do usuário.

**Validates: Requirements 4.2**

---

### Property 8: Detalhe do pedido contém todos os campos obrigatórios

*For any* resposta válida de `GET /pedidos/{id}`, o detalhe exibido deve conter: lista de itens, valor total, Order_Status e data de criação.

**Validates: Requirements 6.2**

---

## Error Handling

| Cenário | Comportamento |
|---|---|
| `VITE_MP_PUBLIC_KEY` ausente | Exibe mensagem "Pagamento indisponível no momento" e não renderiza o Brick |
| `POST /pedidos` falha | Toast de erro descritivo; carrinho mantido; `step` permanece `'cart'` |
| `POST /payments` falha | Toast de erro descritivo; pedido criado mantido para reprocessamento |
| Brick `onError` | Exibe mensagem de erro inline; sem redirecionamento; carrinho mantido |
| `GET /pedidos/usuario/:id` falha | Mensagem de erro com botão "Tentar novamente" |
| `GET /pedidos/:id` falha | Mensagem de erro descritiva no painel de detalhe |
| `GET /payments/pedido/:id` falha | Badge de status omitido ou exibe "Status indisponível" |
| Usuário não autenticado em `/perfil` | Redireciona para `/` com toast informativo |

---

## Testing Strategy

### Unit Tests

Focar em funções puras e casos específicos:
- `formatDate(null)` → `"—"`
- `formatDate("invalid")` → `"—"`
- `formatDate("2024-01-15T10:00:00Z")` → `"15/01/2024"`
- `formatCurrency(0)` → `"R$ 0,00"`
- `getPaymentStatusConfig("APPROVED")` → `{ label: "Pago", classes: "..." }`
- `getPaymentStatusConfig("UNKNOWN")` → fallback sem crash
- Renderização de `Perfil.tsx` sem autenticação → redireciona

### Property-Based Tests

Biblioteca: **fast-check** (já compatível com Vitest)

Configuração mínima: 100 iterações por propriedade.

Cada teste deve ter um comentário de rastreabilidade:
`// Feature: checkout-profile, Property N: <texto da propriedade>`

| Propriedade | Gerador | Asserção |
|---|---|---|
| P2: Carrinho limpo após pagamento | `fc.array(fc.record({...}), {minLength:1})` | `cartStore.items.length === 0` após callback approved/pending |
| P3: Erro não limpa carrinho | `fc.array(fc.record({...}), {minLength:1})` | `cartStore.items.length === N` após onError |
| P4: Formatação de data | `fc.date()` | resultado bate com `toLocaleDateString('pt-BR')` |
| P5: Formatação de valor | `fc.float({min:0, max:99999})` | resultado começa com `"R$ "` e tem `,` como separador decimal |
| P6: Badge de status | `fc.constantFrom('PENDING','APPROVED','REJECTED','CANCELLED','REFUNDED')` | retorno tem `label` e `classes` definidos |

Cada propriedade de corretude do design deve ser coberta por exatamente um teste property-based.
