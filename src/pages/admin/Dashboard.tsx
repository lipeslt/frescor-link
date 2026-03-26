import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { ShoppingCart, DollarSign, Package, Users } from "lucide-react";

import { adminService, AdminPedido } from "@/services/adminService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartConfig } from "@/components/ui/chart";

// ─── Pure helper functions ────────────────────────────────────────────────────

export function agruparPedidosPorData(
  pedidos: AdminPedido[]
): { data: string; total: number }[] {
  const map: Record<string, number> = {};
  for (const pedido of pedidos) {
    const data = pedido.dataCriacao?.slice(0, 10) ?? "";
    map[data] = (map[data] ?? 0) + (pedido.valorTotal ?? 0);
  }
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, total]) => ({ data, total }));
}

export function rankingProdutosMaisVendidos(pedidos: AdminPedido[]) {
  return [...pedidos]
    .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())
    .slice(0, 5);
}

export function filtrarPorIntervalo(
  pedidos: AdminPedido[],
  inicio: Date,
  fim: Date
): AdminPedido[] {
  return pedidos.filter((p) => {
    const d = new Date(p.dataCriacao);
    return d >= inicio && d <= fim;
  });
}

// ─── Formatters ───────────────────────────────────────────────────────────────

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

// ─── Chart config ─────────────────────────────────────────────────────────────

const chartConfig: ChartConfig = {
  total: {
    label: "Receita (R$)",
    color: "hsl(var(--primary))",
  },
};

// ─── Skeleton helpers ─────────────────────────────────────────────────────────

function MetricCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-24" />
      </CardContent>
    </Card>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const { data: pedidosPage, isLoading: loadingPedidos } = useQuery({
    queryKey: ["admin", "pedidos", { page: 0, size: 1000 }],
    queryFn: () => adminService.getPedidos(0, 1000).then((r) => r.data),
  });

  const { data: produtosPage, isLoading: loadingProdutos } = useQuery({
    queryKey: ["admin", "produtos", { page: 0, size: 1000 }],
    queryFn: () => adminService.getProdutos(0, 1000).then((r) => r.data),
  });

  const { data: usuariosPage, isLoading: loadingUsuarios } = useQuery({
    queryKey: ["admin", "usuarios", { page: 0, size: 1 }],
    queryFn: () => adminService.getUsuarios(0, 1).then((r) => r.data),
  });

  const isLoading = loadingPedidos || loadingProdutos || loadingUsuarios;

  const pedidosFiltrados = useMemo(() => {
    const todos = pedidosPage?.content ?? [];
    if (!dataInicio && !dataFim) return todos;
    const inicio = dataInicio ? new Date(dataInicio + "T00:00:00") : new Date(0);
    const fim = dataFim ? new Date(dataFim + "T23:59:59") : new Date(8640000000000000);
    return filtrarPorIntervalo(todos, inicio, fim);
  }, [pedidosPage, dataInicio, dataFim]);

  const totalPedidos = pedidosFiltrados.length;
  const receitaTotal = pedidosFiltrados.reduce((acc, p) => acc + (p.valorTotal ?? 0), 0);
  const totalProdutos = produtosPage?.totalElements ?? 0;
  const totalUsuarios = usuariosPage?.totalElements ?? 0;

  const dadosGrafico = useMemo(() => agruparPedidosPorData(pedidosFiltrados), [pedidosFiltrados]);
  const ultimosPedidos = useMemo(() => rankingProdutosMaisVendidos(pedidosFiltrados), [pedidosFiltrados]);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Date filter */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">De:</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Até:</label>
          <input
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
        {(dataInicio || dataFim) && (
          <button
            onClick={() => { setDataInicio(""); setDataFim(""); }}
            className="text-sm text-muted-foreground underline"
          >
            Limpar filtro
          </button>
        )}
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalPedidos}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatBRL(receitaTotal)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Produtos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalProdutos}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Usuários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{totalUsuarios}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Pedidos por Período</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : dadosGrafico.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum pedido no período selecionado.</p>
          ) : (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <BarChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatBRL(v)} />
                <Bar dataKey="total" fill="var(--color-total)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Last orders */}
      <Card>
        <CardHeader>
          <CardTitle>Últimos Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : ultimosPedidos.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum pedido encontrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4">ID</th>
                    <th className="text-left py-2 pr-4">Usuário</th>
                    <th className="text-left py-2 pr-4">Status</th>
                    <th className="text-right py-2">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimosPedidos.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-mono text-xs">{p.id.slice(0, 8)}…</td>
                      <td className="py-2 pr-4">{p.usuario?.nome ?? "—"}</td>
                      <td className="py-2 pr-4">{p.status}</td>
                      <td className="py-2 text-right">{formatBRL(p.valorTotal ?? 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
