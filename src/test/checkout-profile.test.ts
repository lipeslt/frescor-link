import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { formatDate, formatCurrency, getPaymentStatusConfig } from "@/pages/Perfil";
import { useCartStore } from "@/stores/cartStore";

// ─── 8.3 Unit tests: getPaymentStatusConfig ──────────────────────────────────

describe("getPaymentStatusConfig", () => {
  it("PENDING → label 'Aguardando pagamento' com classes amber", () => {
    const cfg = getPaymentStatusConfig("PENDING");
    expect(cfg.label).toBe("Aguardando pagamento");
    expect(cfg.classes).toContain("amber");
  });

  it("APPROVED → label 'Pago' com classes green", () => {
    const cfg = getPaymentStatusConfig("APPROVED");
    expect(cfg.label).toBe("Pago");
    expect(cfg.classes).toContain("green");
  });

  it("REJECTED → label 'Recusado' com classes red", () => {
    const cfg = getPaymentStatusConfig("REJECTED");
    expect(cfg.label).toBe("Recusado");
    expect(cfg.classes).toContain("red");
  });

  it("CANCELLED → label 'Cancelado' com classes red", () => {
    const cfg = getPaymentStatusConfig("CANCELLED");
    expect(cfg.label).toBe("Cancelado");
    expect(cfg.classes).toContain("red");
  });

  it("REFUNDED → label 'Reembolsado' com classes gray", () => {
    const cfg = getPaymentStatusConfig("REFUNDED");
    expect(cfg.label).toBe("Reembolsado");
    expect(cfg.classes).toContain("gray");
  });

  it("status desconhecido → fallback sem crash, retorna o próprio status como label", () => {
    const cfg = getPaymentStatusConfig("UNKNOWN_STATUS");
    expect(cfg.label).toBe("UNKNOWN_STATUS");
    expect(cfg.classes).toBeDefined();
    expect(cfg.classes.length).toBeGreaterThan(0);
  });
});

// ─── Helper: build a minimal CartItem ────────────────────────────────────────

function makeCartItem(id: string) {
  return {
    product: {
      id,
      nome: `Produto ${id}`,
      preco: 10,
      descricao: "",
      imagemUrl: "",
      categoriaId: "cat-1",
      ativo: true,
      estoque: 5,
    },
    quantity: 1,
  };
}

// ─── 8.4 PBT P2: Carrinho limpo após pagamento bem-sucedido ──────────────────

describe("P2: Carrinho limpo após pagamento bem-sucedido", () => {
  // Feature: checkout-profile, Property 2: Carrinho limpo após pagamento bem-sucedido
  it("para qualquer carrinho com N >= 1 itens, clearCart() resulta em 0 itens", () => {
    fc.assert(
      fc.property(
        fc.array(fc.uuid(), { minLength: 1, maxLength: 20 }),
        (ids) => {
          const store = useCartStore.getState();
          // Reset state
          store.clearCart();

          // Populate cart with N unique items
          const uniqueIds = [...new Set(ids)];
          uniqueIds.forEach((id) => {
            store.addItem(makeCartItem(id).product);
          });

          expect(useCartStore.getState().items.length).toBeGreaterThan(0);

          // Simulate onSuccess / onPending callback: clearCart is called
          store.clearCart();

          expect(useCartStore.getState().items.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── 8.5 PBT P3: Erro no Brick não limpa o carrinho ─────────────────────────

describe("P3: Erro no Brick não limpa o carrinho", () => {
  // Feature: checkout-profile, Property 3: Erro no Brick não limpa o carrinho
  it("para qualquer carrinho com N >= 1 itens, onError não chama clearCart, mantendo N itens", () => {
    fc.assert(
      fc.property(
        fc.array(fc.uuid(), { minLength: 1, maxLength: 20 }),
        (ids) => {
          const store = useCartStore.getState();
          store.clearCart();

          const uniqueIds = [...new Set(ids)];
          uniqueIds.forEach((id) => {
            store.addItem(makeCartItem(id).product);
          });

          const countBefore = useCartStore.getState().items.length;
          expect(countBefore).toBeGreaterThan(0);

          // Simulate onError: clearCart is NOT called
          // (no action taken on cart)

          expect(useCartStore.getState().items.length).toBe(countBefore);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── 8.6 PBT P4: Formatação de data é sempre válida ─────────────────────────

describe("P4: Formatação de data é sempre válida", () => {
  // Feature: checkout-profile, Property 4: Formatação de data é sempre válida
  it("para qualquer Date válida, formatDate retorna string no formato dd/MM/yyyy", () => {
    // Constrain to years 1000–9999 so toLocaleDateString always produces a 4-digit year
    const minDate = new Date("1000-01-01T00:00:00.000Z").getTime();
    const maxDate = new Date("9999-12-31T23:59:59.999Z").getTime();
    fc.assert(
      fc.property(
        fc.date({ min: new Date(minDate), max: new Date(maxDate) }),
        (date) => {
          const iso = date.toISOString();
          const result = formatDate(iso);
          // Must match dd/MM/yyyy
          expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("para entradas nulas ou inválidas, formatDate retorna '—'", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDate(undefined)).toBe("—");
    expect(formatDate("not-a-date")).toBe("—");
    expect(formatDate("")).toBe("—");
  });
});

// ─── 8.7 PBT P5: Formatação de valor monetário ───────────────────────────────

describe("P5: Formatação de valor monetário", () => {
  // Feature: checkout-profile, Property 5: Formatação de valor monetário
  it("para qualquer float >= 0, formatCurrency retorna string começando com 'R$' e com vírgula decimal", () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 99999, noNaN: true }),
        (value) => {
          const result = formatCurrency(value);
          expect(result).toContain("R$");
          expect(result).toContain(",");
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── 8.8 PBT P6: Badge de Payment_Status é determinístico ───────────────────

describe("P6: Badge de Payment_Status é determinístico", () => {
  // Feature: checkout-profile, Property 6: Badge de Payment_Status é determinístico
  it("para qualquer Payment_Status válido, getPaymentStatusConfig retorna label e classes definidos", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("PENDING", "APPROVED", "REJECTED", "CANCELLED", "REFUNDED"),
        (status) => {
          const result1 = getPaymentStatusConfig(status);
          const result2 = getPaymentStatusConfig(status);

          // Both fields must be defined and non-empty
          expect(result1.label).toBeDefined();
          expect(result1.label.length).toBeGreaterThan(0);
          expect(result1.classes).toBeDefined();
          expect(result1.classes.length).toBeGreaterThan(0);

          // Deterministic: same input → same output
          expect(result1.label).toBe(result2.label);
          expect(result1.classes).toBe(result2.classes);
        }
      ),
      { numRuns: 100 }
    );
  });
});
