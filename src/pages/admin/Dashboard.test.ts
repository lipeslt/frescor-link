import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  agruparPedidosPorData,
  filtrarPorIntervalo,
  rankingProdutosMaisVendidos,
} from "./Dashboard";
import type { AdminPedido } from "@/services/adminService";

// ─── Arbitrary ────────────────────────────────────────────────────────────────

const MIN_TS = new Date("2020-01-01").getTime();
const MAX_TS = new Date("2030-12-31").getTime();

function arbitraryPedido(): fc.Arbitrary<AdminPedido> {
  return fc.record({
    id: fc.uuid(),
    usuario: fc.record({
      id: fc.uuid(),
      nome: fc.string({ minLength: 1, maxLength: 50 }),
      email: fc.emailAddress(),
    }),
    status: fc.constantFrom(
      "AGUARDANDO_PAGAMENTO",
      "PAGO",
      "SEPARACAO_ESTOQUE",
      "ENVIADO",
      "ENTREGUE",
      "CANCELADO"
    ) as fc.Arbitrary<AdminPedido["status"]>,
    valorTotal: fc.float({ min: 0, max: 100000, noNaN: true }),
    dataCriacao: fc
      .integer({ min: MIN_TS, max: MAX_TS })
      .map((ts) => new Date(ts).toISOString()),
  });
}

// ─── Property 13: Agrupamento de pedidos por data é correto ──────────────────
// Feature: admin-panel, Property 13: Agrupamento de pedidos por data é correto
// Validates: Requirements 7.2

describe("agruparPedidosPorData", () => {
  it("cada pedido aparece exatamente uma vez no grupo correspondente à sua data", () => {
    fc.assert(
      fc.property(fc.array(arbitraryPedido(), { minLength: 0, maxLength: 50 }), (pedidos) => {
        const grupos = agruparPedidosPorData(pedidos);

        // Every pedido's date must appear in exactly one group
        for (const pedido of pedidos) {
          const dataEsperada = pedido.dataCriacao.slice(0, 10);
          const gruposComData = grupos.filter((g) => g.data === dataEsperada);
          expect(gruposComData).toHaveLength(1);
        }

        // Total sum across all groups must equal sum of all pedidos
        const somaGrupos = grupos.reduce((acc, g) => acc + g.total, 0);
        const somaOriginal = pedidos.reduce((acc, p) => acc + (p.valorTotal ?? 0), 0);
        expect(somaGrupos).toBeCloseTo(somaOriginal, 5);
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Property 14: Ranking de produtos mais vendidos é correto ─────────────────
// Feature: admin-panel, Property 14: Ranking de produtos mais vendidos é correto
// Validates: Requirements 7.3

describe("rankingProdutosMaisVendidos", () => {
  it("retorna no máximo 5 pedidos ordenados do mais recente para o mais antigo", () => {
    fc.assert(
      fc.property(fc.array(arbitraryPedido(), { minLength: 0, maxLength: 50 }), (pedidos) => {
        const resultado = rankingProdutosMaisVendidos(pedidos);

        // At most 5 results
        expect(resultado.length).toBeLessThanOrEqual(5);

        // Ordered descending by dataCriacao
        for (let i = 0; i < resultado.length - 1; i++) {
          const a = new Date(resultado[i].dataCriacao).getTime();
          const b = new Date(resultado[i + 1].dataCriacao).getTime();
          expect(a).toBeGreaterThanOrEqual(b);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Property 15: Filtro por intervalo de datas exclui pedidos fora do range ──
// Feature: admin-panel, Property 15: Filtro por intervalo exclui pedidos fora do range
// Validates: Requirements 7.4

describe("filtrarPorIntervalo", () => {
  it("todos os pedidos retornados estão dentro do intervalo [inicio, fim]", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryPedido(), { minLength: 0, maxLength: 50 }),
        fc.integer({ min: MIN_TS, max: MAX_TS }),
        fc.integer({ min: MIN_TS, max: MAX_TS }),
        (pedidos, ts1, ts2) => {
          const [inicio, fim] = ts1 <= ts2
            ? [new Date(ts1), new Date(ts2)]
            : [new Date(ts2), new Date(ts1)];
          const resultado = filtrarPorIntervalo(pedidos, inicio, fim);

          expect(
            resultado.every((p) => {
              const d = new Date(p.dataCriacao);
              return d >= inicio && d <= fim;
            })
          ).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("nenhum pedido fora do intervalo é incluído no resultado", () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryPedido(), { minLength: 0, maxLength: 50 }),
        fc.integer({ min: MIN_TS, max: MAX_TS }),
        fc.integer({ min: MIN_TS, max: MAX_TS }),
        (pedidos, ts1, ts2) => {
          const [inicio, fim] = ts1 <= ts2
            ? [new Date(ts1), new Date(ts2)]
            : [new Date(ts2), new Date(ts1)];
          const resultado = filtrarPorIntervalo(pedidos, inicio, fim);
          const resultadoIds = new Set(resultado.map((p) => p.id));

          const foraDoIntervalo = pedidos.filter((p) => {
            const d = new Date(p.dataCriacao);
            return d < inicio || d > fim;
          });

          for (const pedido of foraDoIntervalo) {
            expect(resultadoIds.has(pedido.id)).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
