import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Trash2, Loader2, Plus } from "lucide-react";

import { adminService, AdminProduto, AdminCategoria } from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ─── Schema ───────────────────────────────────────────────────────────────────

const produtoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  preco: z.coerce.number().positive("Preço deve ser positivo"),
  estoque: z.coerce.number().int().min(0, "Estoque não pode ser negativo"),
  categoriaId: z.string().optional(),
  imagemUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  ativo: z.boolean().default(true),
});

type ProdutoForm = z.infer<typeof produtoSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatarPreco = (valor: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

const PAGE_SIZE = 10;

// ─── Component ────────────────────────────────────────────────────────────────

export default function Produtos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [nomeInput, setNomeInput] = useState("");
  const [nomeFiltro, setNomeFiltro] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | undefined>(undefined);
  const [dialogAberto, setDialogAberto] = useState(false);
  const [editando, setEditando] = useState<AdminProduto | null>(null);
  const [excluindo, setExcluindo] = useState<AdminProduto | null>(null);

  // Debounce simples para o filtro de nome
  useEffect(() => {
    const timer = setTimeout(() => {
      setNomeFiltro(nomeInput);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [nomeInput]);

  // ─── Queries ────────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "produtos", { page, size: PAGE_SIZE, nome: nomeFiltro, categoriaId: categoriaFiltro }],
    queryFn: () =>
      adminService.getProdutos(page, PAGE_SIZE, nomeFiltro || undefined, categoriaFiltro).then((r) => r.data),
  });

  const { data: categoriasData } = useQuery({
    queryKey: ["admin", "categorias-select"],
    queryFn: () => adminService.getCategorias(0, 100).then((r) => r.data),
  });

  const produtos = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;
  const categorias: AdminCategoria[] = categoriasData?.content ?? [];

  // ─── Form ───────────────────────────────────────────────────────────────────

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<ProdutoForm>({
    resolver: zodResolver(produtoSchema),
    mode: "onChange",
    defaultValues: { ativo: true },
  });

  const ativoValue = watch("ativo");

  function abrirCriacao() {
    setEditando(null);
    reset({ nome: "", preco: 0, estoque: 0, categoriaId: undefined, imagemUrl: "", ativo: true });
    setDialogAberto(true);
  }

  function abrirEdicao(produto: AdminProduto) {
    setEditando(produto);
    reset({
      nome: produto.nome,
      preco: produto.preco,
      estoque: produto.estoque,
      categoriaId: produto.categoriaId ?? undefined,
      imagemUrl: produto.imagemUrl ?? "",
      ativo: produto.ativo,
    });
    setDialogAberto(true);
  }

  function fecharDialog() {
    setDialogAberto(false);
    setEditando(null);
  }

  // ─── Mutations ──────────────────────────────────────────────────────────────

  const invalidar = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "produtos"] });

  const criarMutation = useMutation({
    mutationFn: (data: ProdutoForm) =>
      adminService.createProduto({
        nome: data.nome,
        preco: data.preco,
        estoque: data.estoque,
        categoriaId: data.categoriaId || undefined,
        imagemUrl: data.imagemUrl || undefined,
        ativo: data.ativo,
      }),
    onSuccess: () => {
      toast({ title: "Produto criado com sucesso" });
      invalidar();
      fecharDialog();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "Erro ao salvar produto";
      toast({ title: msg, variant: "destructive" });
    },
  });

  const editarMutation = useMutation({
    mutationFn: (data: ProdutoForm) =>
      adminService.updateProduto(editando!.id, {
        nome: data.nome,
        preco: data.preco,
        estoque: data.estoque,
        categoriaId: data.categoriaId || undefined,
        imagemUrl: data.imagemUrl || undefined,
        ativo: data.ativo,
      }),
    onSuccess: () => {
      toast({ title: "Produto atualizado com sucesso" });
      invalidar();
      fecharDialog();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "Erro ao salvar produto";
      toast({ title: msg, variant: "destructive" });
    },
  });

  const excluirMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteProduto(id),
    onSuccess: () => {
      toast({ title: "Produto excluído com sucesso" });
      invalidar();
      setExcluindo(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "Erro ao excluir produto";
      toast({ title: msg, variant: "destructive" });
      setExcluindo(null);
    },
  });

  function onSubmit(data: ProdutoForm) {
    if (editando) {
      editarMutation.mutate(data);
    } else {
      criarMutation.mutate(data);
    }
  }

  const isPending = criarMutation.isPending || editarMutation.isPending;

  const nomeCategoria = (id?: string) =>
    categorias.find((c) => c.id === id)?.nome ?? "—";

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Produtos</h1>
        <Button onClick={abrirCriacao}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Filtrar por nome..."
          value={nomeInput}
          onChange={(e) => setNomeInput(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={categoriaFiltro ?? "all"}
          onValueChange={(v) => {
            setCategoriaFiltro(v === "all" ? undefined : v);
            setPage(0);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categorias.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Estoque</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Ativo</TableHead>
            <TableHead className="w-24 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <>
              {[0, 1, 2].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))}
            </>
          ) : produtos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                Nenhum produto encontrado.
              </TableCell>
            </TableRow>
          ) : (
            produtos.map((prod) => (
              <TableRow key={prod.id}>
                <TableCell className="font-medium">{prod.nome}</TableCell>
                <TableCell>{formatarPreco(prod.preco)}</TableCell>
                <TableCell>{prod.estoque}</TableCell>
                <TableCell className="text-muted-foreground">{nomeCategoria(prod.categoriaId)}</TableCell>
                <TableCell>{prod.ativo ? "Sim" : "Não"}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => abrirEdicao(prod)}
                    aria-label="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setExcluindo(prod)}
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
            <DialogTitle>{editando ? "Editar Produto" : "Novo Produto"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" {...register("nome")} placeholder="Nome do produto" />
              {errors.nome && (
                <p className="text-sm text-destructive">{errors.nome.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="preco">Preço (R$)</Label>
                <Input id="preco" type="number" step="0.01" min="0" {...register("preco")} placeholder="0,00" />
                {errors.preco && (
                  <p className="text-sm text-destructive">{errors.preco.message}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="estoque">Estoque</Label>
                <Input id="estoque" type="number" min="0" step="1" {...register("estoque")} placeholder="0" />
                {errors.estoque && (
                  <p className="text-sm text-destructive">{errors.estoque.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="categoriaId">Categoria</Label>
              <Select
                value={watch("categoriaId") ?? "none"}
                onValueChange={(v) => setValue("categoriaId", v === "none" ? undefined : v, { shouldValidate: true })}
              >
                <SelectTrigger id="categoriaId">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {categorias.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="imagemUrl">URL da Imagem</Label>
              <Input id="imagemUrl" {...register("imagemUrl")} placeholder="https://..." />
              {errors.imagemUrl && (
                <p className="text-sm text-destructive">{errors.imagemUrl.message}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="ativo"
                checked={ativoValue}
                onCheckedChange={(checked) =>
                  setValue("ativo", checked === true, { shouldValidate: true })
                }
              />
              <Label htmlFor="ativo">Produto ativo</Label>
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
            <AlertDialogTitle>Excluir produto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto{" "}
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
