import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Trash2, Loader2, Plus } from "lucide-react";

import { adminService, AdminCategoria } from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

// ─── Schema ───────────────────────────────────────────────────────────────────

const categoriaSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  descricao: z.string().optional(),
});

type CategoriaForm = z.infer<typeof categoriaSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10;

export default function Categorias() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [editando, setEditando] = useState<AdminCategoria | null>(null);
  const [excluindo, setExcluindo] = useState<AdminCategoria | null>(null);

  // ─── Query ──────────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "categorias", { page, size: PAGE_SIZE }],
    queryFn: () => adminService.getCategorias(page, PAGE_SIZE).then((r) => r.data),
  });

  const categorias = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;

  // ─── Form ───────────────────────────────────────────────────────────────────

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<CategoriaForm>({
    resolver: zodResolver(categoriaSchema),
    mode: "onChange",
  });

  function abrirCriacao() {
    setEditando(null);
    reset({ nome: "", descricao: "" });
    setDialogAberto(true);
  }

  function abrirEdicao(categoria: AdminCategoria) {
    setEditando(categoria);
    reset({ nome: categoria.nome, descricao: categoria.descricao ?? "" });
    setDialogAberto(true);
  }

  function fecharDialog() {
    setDialogAberto(false);
    setEditando(null);
  }

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const invalidar = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "categorias"] });

  const criarMutation = useMutation({
    mutationFn: (data: CategoriaForm) =>
      adminService.createCategoria({ nome: data.nome, descricao: data.descricao }),
    onSuccess: () => {
      toast({ title: "Categoria criada com sucesso" });
      invalidar();
      fecharDialog();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "Erro ao salvar categoria";
      toast({ title: msg, variant: "destructive" });
    },
  });

  const editarMutation = useMutation({
    mutationFn: (data: CategoriaForm) =>
      adminService.updateCategoria(editando!.id, data),
    onSuccess: () => {
      toast({ title: "Categoria atualizada com sucesso" });
      invalidar();
      fecharDialog();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "Erro ao salvar categoria";
      toast({ title: msg, variant: "destructive" });
    },
  });

  const excluirMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteCategoria(id),
    onSuccess: () => {
      toast({ title: "Categoria excluída com sucesso" });
      invalidar();
      setExcluindo(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "Erro ao excluir categoria";
      toast({ title: msg, variant: "destructive" });
      setExcluindo(null);
    },
  });

  function onSubmit(data: CategoriaForm) {
    if (editando) {
      editarMutation.mutate(data);
    } else {
      criarMutation.mutate(data);
    }
  }

  const isPending = criarMutation.isPending || editarMutation.isPending;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categorias</h1>
        <Button onClick={abrirCriacao}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="w-24 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <>
              {[0, 1, 2].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </>
          ) : categorias.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                Nenhuma categoria encontrada.
              </TableCell>
            </TableRow>
          ) : (
            categorias.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell className="font-medium">{cat.nome}</TableCell>
                <TableCell className="text-muted-foreground">{cat.descricao ?? "—"}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => abrirEdicao(cat)}
                    aria-label="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setExcluindo(cat)}
                    aria-label="Excluir"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
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

      {/* Dialog criar / editar */}
      <Dialog open={dialogAberto} onOpenChange={(open) => !open && fecharDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" {...register("nome")} placeholder="Nome da categoria" />
              {errors.nome && (
                <p className="text-sm text-destructive">{errors.nome.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="descricao">Descrição</Label>
              <Input id="descricao" {...register("descricao")} placeholder="Descrição (opcional)" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={fecharDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!isValid || isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editando ? "Salvar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de confirmação de exclusão */}
      <AlertDialog open={!!excluindo} onOpenChange={(open) => !open && setExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria{" "}
              <strong>{excluindo?.nome}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => excluindo && excluirMutation.mutate(excluindo.id)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
