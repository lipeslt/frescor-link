import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { adminService, AdminUser, Role } from "@/services/adminService";
import { useAuthStore } from "@/stores/authStore";
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

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

// ─── Component ────────────────────────────────────────────────────────────────

export default function Usuarios() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [page, setPage] = useState(0);

  // ─── Query ──────────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "usuarios", { page, size: PAGE_SIZE }],
    queryFn: () =>
      adminService.getUsuarios(page, PAGE_SIZE).then((r) => r.data),
  });

  const usuarios = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  // ─── Mutation ───────────────────────────────────────────────────────────────

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) =>
      adminService.updateUsuarioRole(id, role),
    onSuccess: () => {
      toast({ title: "Role atualizada com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["admin", "usuarios"] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "Erro ao atualizar role";
      toast({ title: msg, variant: "destructive" });
    },
  });

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Usuários</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Criado em</TableHead>
            <TableHead className="w-40">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <>
              {[0, 1, 2].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-32" /></TableCell>
                </TableRow>
              ))}
            </>
          ) : usuarios.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground py-8"
              >
                Nenhum usuário encontrado.
              </TableCell>
            </TableRow>
          ) : (
            usuarios.map((usuario: AdminUser) => (
              <TableRow key={usuario.id}>
                <TableCell className="font-medium">{usuario.nome}</TableCell>
                <TableCell className="text-muted-foreground">
                  {usuario.email}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={usuario.role === "ADMIN" ? "default" : "secondary"}
                  >
                    {usuario.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(usuario.criadoEm).toLocaleDateString("pt-BR")}
                </TableCell>
                <TableCell>
                  <Select
                    value={usuario.role}
                    disabled={usuario.id === currentUserId}
                    onValueChange={(value: Role) =>
                      updateRoleMutation.mutate({ id: usuario.id, role: value })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">ADMIN</SelectItem>
                      <SelectItem value="USER">USER</SelectItem>
                    </SelectContent>
                  </Select>
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
    </div>
  );
}
