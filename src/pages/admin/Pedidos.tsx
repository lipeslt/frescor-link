import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";

import {
  adminService,
  AdminPedido,
  AdminPedidoDetalhe,
  StatusPedido,
} from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const STATUS_OPTIONS: { value: StatusPedido; label: string }[] = [
  { value: "AGUARDANDO_PAGAMENTO", label: "Aguardando Pagamento" },
  { value: "PAGO", label: "Pago" },
  { value: "SEPARACAO_ESTOQUE", label: "Separação Estoque" },
  { value: "ENVIADO", label: "Enviado" },
  { value: "ENTREGUE", label: "Entregue" },
  { value: "CANCELADO", label: "Cancelado" },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("pt-BR");

const shortId = (id: string) => `${id.slice(0, 8)}…`;

// ─── Sheet de Detalhes ────────────────────────────────────────────────────────

function PedidoSheet({
  pedidoId,
  open,
  onClose,
}: {
  pedidoId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "pedido", pedidoId],
    queryFn: () =>
      adminService.getPedidoById(pedidoId!).then((r) => r.data),
    enabled: !!pedidoId,
  });

  const pedido = data as AdminPedidoDetalhe | undefined;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalhes do Pedido</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="mt-6 space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        ) : pedido ? (
          <div className="mt-6 space-y-4 text-sm">
            <div className="space-y-1">
              <p><span className="font-medium">ID:</span> {pedido.id}</p>
              <p><span className="font-medium">Usuário:</span> {pedido.usuario.nome} ({pedido.usuario.email})</p>
              <p><span className="font-medium">Status:</span> {pedido.status}</p>
              <p><span className="font-medium">Total:</span> {formatCurrency(pedido.valorTotal)}</p>
              <p><span className="font-medium">Data:</span> {formatDate(pedido.dataCriacao)}</p>
            </div>

            <div>
              <p className="font-medium mb-2">Itens</p>
              <div className="space-y-2">
                {pedido.itens.map((item, idx) => (
                  <div key={idx} className="flex justify-between border rounded p-2">
                    <div>
                      <p className="font-medium">{item.nomeProduto}</p>
                      <p className="text-muted-foreground">Qtd: {item.quantidade}</p>
                    </div>
                    <p>{formatCurrency(item.precoUnitario)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Pedidos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [filterStatus, setFilterStatus] = useState<StatusPedido | "TODOS">("TODOS");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // ─── Query ──────────────────────────────────────────────────────────────────

  const status = filterStatus === "TODOS" ? undefined : filterStatus;

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "pedidos", { page, size: PAGE_SIZE, status }],
    queryFn: () =>
      adminService.getPedidos(page, PAGE_SIZE, status).then((r) => r.data),
  });

  const pedidos = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  // ─── Mutation ───────────────────────────────────────────────────────────────

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusPedido }) =>
      adminService.updatePedidoStatus(id, status),
    onSuccess: () => {
      toast({ title: "Status atualizado com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["admin", "pedidos"] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "Erro ao atualizar status";
      toast({ title: msg, variant: "destructive" });
    },
  });

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleRowClick = (id: string) => {
    setSelectedId(id);
    setSheetOpen(true);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pedidos</h1>

        <Select
          value={filterStatus}
          onValueChange={(v) => {
            setFilterStatus(v as StatusPedido | "TODOS");
            setPage(0);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos</SelectItem>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Usuário</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="w-44">Alterar Status</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <>
              {[0, 1, 2].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-40" /></TableCell>
                  <TableCell />
                </TableRow>
              ))}
            </>
          ) : pedidos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                Nenhum pedido encontrado.
              </TableCell>
            </TableRow>
          ) : (
            pedidos.map((pedido: AdminPedido) => (
              <TableRow
                key={pedido.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(pedido.id)}
              >
                <TableCell className="font-mono text-xs">{shortId(pedido.id)}</TableCell>
                <TableCell>{pedido.usuario.nome}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{pedido.status}</Badge>
                </TableCell>
                <TableCell>{formatCurrency(pedido.valorTotal)}</TableCell>
                <TableCell>{formatDate(pedido.dataCriacao)}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={pedido.status}
                    onValueChange={(v) =>
                      updateStatusMutation.mutate({ id: pedido.id, status: v as StatusPedido })
                    }
                  >
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Paginação */}
      <div className="flex items-center justify-end gap-4">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 0}
          onClick={() => setPage((p) => p - 1)}
        >
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground">
          Página {page + 1} de {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page + 1 >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Próxima
        </Button>
      </div>

      <PedidoSheet
        pedidoId={selectedId}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}
