import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  LogOut,
  Package,
  Layers,
  Save,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { type Produto, type Stack } from "@shared/schema";
import { ReorderStacksModal } from "@/components/reorder-stacks-modal";

interface ProductFormData {
  titulo: string;
  valorBruto: string;
  valorDesconto: string;
  descricao: string;
  fotos: string[];
}

interface SelectedProduct {
  id: string;
  titulo: string;
  ordem: number;
}

interface StackFormData {
  titulo: string;
  ordem: string;
  produtos: SelectedProduct[];
}

export function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showProductModal, setShowProductModal] = useState(false);
  const [showStackModal, setShowStackModal] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [editingStack, setEditingStack] = useState<Stack | null>(null);
  const [activeTab, setActiveTab] = useState("products");

  const [productForm, setProductForm] = useState<ProductFormData>({
    titulo: "",
    valorBruto: "",
    valorDesconto: "",
    descricao: "",
    fotos: [""],
  });

  const [stackForm, setStackForm] = useState<StackFormData>({
    titulo: "",
    ordem: "1",
    produtos: [],
  });
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    [],
  );

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("admin-token");
    if (!token) {
      setLocation("/");
      return;
    }
  }, [setLocation]);

  // Reset selected products when stack modal is closed or a new stack is being created
  useEffect(() => {
    if (!showStackModal) {
      setSelectedProducts([]);
      setProductSearchTerm("");
    }
  }, [showStackModal]);

  // Populate selected products when editing an existing stack
  useEffect(() => {
    if (editingStack && editingStack.produtos) {
      const productsForStack = editingStack.produtos
        .map((sp: any) => ({
          id: sp.produto.id,
          titulo: sp.produto.titulo,
          ordem: sp.ordem,
        }))
        .sort((a: any, b: any) => a.ordem - b.ordem);
      setSelectedProducts(productsForStack);
    } else {
      setSelectedProducts([]);
    }
  }, [editingStack]);

  // Fetch data
  const { data: produtos, isLoading: produtosLoading } = useQuery({
    queryKey: ["/api/produtos"],
    queryFn: () => api.getProdutos("", 1, 100, undefined, true),
  });

  const { data: stacks, isLoading: stacksLoading } = useQuery({
    queryKey: ["/api/stacks", activeTab],
    queryFn: () => api.getStacks(true),
    enabled: activeTab === "stacks",
  });

  // Mutations
  const logoutMutation = useMutation({
    mutationFn: () => api.logoutAdmin(),
    onSuccess: () => {
      toast({ title: "Logout realizado com sucesso!" });
      setLocation("/");
    },
  });

  const createProductMutation = useMutation({
    mutationFn: (data: any) => api.createProduto(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/produtos"] });
      setShowProductModal(false);
      resetProductForm();
      toast({ title: "Produto criado com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar produto",
        description: error.message,
      });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.updateProduto(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/produtos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stacks"] }); // Invalidate stacks to reflect product changes
      setShowProductModal(false);
      resetProductForm();
      toast({ title: "Produto atualizado com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar produto",
        description: error.message,
      });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => api.deleteProduto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/produtos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stacks"] }); // Invalidate stacks to reflect product deletion
      toast({ title: "Produto removido com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao remover produto",
        description: error.message,
      });
    },
  });

  const toggleProductStatusMutation = useMutation({
    mutationFn: (id: string) => api.toggleProdutoStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/produtos"] });
      toast({ title: "Status do produto atualizado com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar status do produto",
        description: error.message,
      });
    },
  });

  const createStackMutation = useMutation({
    mutationFn: (data: any) => api.createStack(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stacks"] });
      setShowStackModal(false);
      resetStackForm();
      toast({ title: "Stack criada com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar stack",
        description: error.message,
      });
    },
  });

  const updateStackMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.updateStack(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stacks"] });
      setShowStackModal(false);
      resetStackForm();
      toast({ title: "Stack atualizada com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar stack",
        description: error.message,
      });
    },
  });

  const deleteStackMutation = useMutation({
    mutationFn: (id: string) => api.deleteStack(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stacks"] });
      toast({ title: "Stack removida com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao remover stack",
        description: error.message,
      });
    },
  });

  const toggleStackStatusMutation = useMutation({
    mutationFn: (id: string) => api.toggleStackStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stacks"] });
      toast({ title: "Status da stack atualizado com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar status da stack",
        description: error.message,
      });
    },
  });

  const reorderStacksMutation = useMutation({
    mutationFn: (data: { stacks: { id: string; ordem: number }[] }) =>
      api.reorderStacks(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stacks"] });
      toast({ title: "Ordem das stacks atualizada com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao reordenar stacks",
        description: error.message,
      });
    },
  });

  const handleReorderStacksSave = (reorderedStacks: Stack[]) => {
    const data = { stacks: reorderedStacks.map((stack) => ({
      id: stack.id,
      ordem: stack.ordem,
    }))};
    reorderStacksMutation.mutate(data);
  };

  // Form handlers
  const resetProductForm = () => {
    setProductForm({
      titulo: "",
      valorBruto: "",
      valorDesconto: "",
      descricao: "",
      fotos: [""],
    });
    setEditingProduct(null);
  };

  const resetStackForm = () => {
    setStackForm({
      titulo: "",
      ordem: "1",
      produtos: [],
    });
    setEditingStack(null);
    setSelectedProducts([]);
    setProductSearchTerm("");
  };

  const handleEditProduct = (produto: Produto) => {
    setEditingProduct(produto);
    setProductForm({
      titulo: produto.titulo,
      valorBruto: produto.valorBruto.toString(),
      valorDesconto: produto.valorDesconto?.toString() || "",
      descricao: produto.descricao || "",
      fotos: produto.fotos.length > 0 ? produto.fotos : [""],
    });
    setShowProductModal(true);
  };

  const handleEditStack = (stack: Stack) => {
    setEditingStack(stack);
    setStackForm({
      titulo: stack.titulo,
      ordem: stack.ordem.toString(),
      produtos: [], // This will be populated by the useEffect
    });
    setShowStackModal(true);
  };

  const handleProductSubmit = () => {
    const data = {
      titulo: productForm.titulo,
      valorBruto: parseFloat(productForm.valorBruto),
      valorDesconto: productForm.valorDesconto
        ? parseFloat(productForm.valorDesconto)
        : undefined,
      descricao: productForm.descricao,
      fotos: productForm.fotos.filter((foto) => foto.trim() !== ""),
    };

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data });
    } else {
      createProductMutation.mutate(data);
    }
  };

  const handleStackSubmit = () => {
    const data = {
      titulo: stackForm.titulo,
      ordem: parseInt(stackForm.ordem),
      produtos: selectedProducts.map((p, index) => ({
        productId: p.id,
        ordem: index + 1, // Assign order based on current array index
      })),
    };

    if (editingStack) {
      updateStackMutation.mutate({ id: editingStack.id, data });
    } else {
      createStackMutation.mutate(data);
    }
  };

  const addFotoField = () => {
    setProductForm((prev) => ({ ...prev, fotos: [...prev.fotos, ""] }));
  };

  const updateFotoField = (index: number, value: string) => {
    setProductForm((prev) => ({
      ...prev,
      fotos: prev.fotos.map((foto, i) => (i === index ? value : foto)),
    }));
  };

  const removeFotoField = (index: number) => {
    setProductForm((prev) => ({
      ...prev,
      fotos: prev.fotos.filter((_, i) => i !== index),
    }));
  };

  const addProductToStack = (product: Produto) => {
    if (!selectedProducts.some((p) => p.id === product.id)) {
      setSelectedProducts((prev) => [
        ...prev,
        { id: product.id, titulo: product.titulo, ordem: prev.length + 1 },
      ]);
    }
  };

  const removeProductFromStack = (productId: string) => {
    setSelectedProducts((prev) =>
      prev
        .filter((p) => p.id !== productId)
        .map((p, index) => ({ ...p, ordem: index + 1 })),
    );
  };

  const moveProductInStack = (productId: string, direction: "up" | "down") => {
    setSelectedProducts((prev) => {
      const index = prev.findIndex((p) => p.id === productId);
      if (index === -1) return prev;

      const newProducts = [...prev];
      const [movedProduct] = newProducts.splice(index, 1);

      if (direction === "up" && index > 0) {
        newProducts.splice(index - 1, 0, movedProduct);
      } else if (direction === "down" && index < newProducts.length) {
        newProducts.splice(index + 1, 0, movedProduct);
      } else {
        return prev; // No change if already at the top/bottom
      }

      return newProducts.map((p, i) => ({ ...p, ordem: i + 1 }));
    });
  };

  const filteredAvailableProducts =
    produtos?.produtos.filter(
      (product) =>
        product.titulo
          .toLowerCase()
          .includes(productSearchTerm.toLowerCase()) &&
        !selectedProducts.some((p) => p.id === product.id),
    ) || [];

  return (
    <div className="min-h-screen pt-16">
      {/* Header */}
      <section className="gradient-bg py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-4">
                ⚙️ Painel <span className="text-gradient">Administrativo</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Gerencie produtos e stacks do seu catálogo
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Tabs
            defaultValue="products"
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-8"
          >
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produtos
              </TabsTrigger>
              <TabsTrigger value="stacks" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Stacks
              </TabsTrigger>
            </TabsList>

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-foreground">
                  Gerenciar Produtos
                </h2>
                <Button
                  onClick={() => setShowProductModal(true)}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Produto
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produto</TableHead>
                          <TableHead>Preço</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {produtosLoading ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              Carregando produtos...
                            </TableCell>
                          </TableRow>
                        ) : !produtos?.produtos.length ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              Nenhum produto cadastrado
                            </TableCell>
                          </TableRow>
                        ) : (
                          produtos.produtos.map((produto: Produto) => (
                            <TableRow key={produto.id}>
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <img
                                    src={
                                      produto.fotos[0] ||
                                      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=48&h=48&fit=crop"
                                    }
                                    alt=""
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                  <div>
                                    <div className="font-medium text-foreground">
                                      {produto.titulo}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      #{produto.id.slice(-8).toUpperCase()}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium text-foreground">
                                  R${" "}
                                  {produto.valorDesconto?.toFixed(2) ||
                                    produto.valorBruto.toFixed(2)}
                                </div>
                                {produto.valorDesconto && (
                                  <div className="text-sm text-muted-foreground line-through">
                                    R$ {produto.valorBruto.toFixed(2)}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    toggleProductStatusMutation.mutate(
                                      produto.id,
                                    )
                                  }
                                  className={
                                    produto.ativo
                                      ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
                                      : "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                                  }
                                >
                                  {produto.ativo ? "Ativo" : "Inativo"}
                                </Button>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditProduct(produto)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      toggleProductStatusMutation.mutate(
                                        produto.id,
                                      )
                                    }
                                  >
                                    {produto.ativo ? "Desativar" : "Ativar"}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      deleteProductMutation.mutate(produto.id)
                                    }
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stacks Tab */}
            <TabsContent value="stacks" className="space-y-8">
              <div className="flex justify-between items-center mb-4">
                <Button
                  onClick={() => setShowStackModal(true)}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Stack
                </Button>
                <Button
                  onClick={() => setShowReorderModal(true)}
                  variant="outline"
                >
                  Reordenar Stacks
                </Button>
              </div>

              <div className="space-y-6">
                {stacksLoading ? (
                  <Card>
                    <CardContent className="py-8">
                      <div className="text-center">Carregando stacks...</div>
                    </CardContent>
                  </Card>
                ) : !stacks?.length || !stacks ? (
                  <Card>
                    <CardContent className="py-8">
                      <div className="text-center">
                        Nenhuma stack cadastrada
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  stacks.map((stack: any) => (
                    <Card key={stack.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl font-semibold">
                              {stack.titulo}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              Ordem: {stack.ordem} • {stack.produtos.length}{" "}
                              produtos
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setLocation(`/buscar?stackId=${stack.id}`)
                              }
                            >
                              Ver Produtos
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                toggleStackStatusMutation.mutate(stack.id)
                              }
                              className={
                                stack.ativo
                                  ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"
                                  : "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                              }
                            >
                              {stack.ativo ? "Ativa" : "Inativa"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditStack(stack)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                deleteStackMutation.mutate(stack.id)
                              }
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {stack.produtos.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {stack.produtos.map((stackProduto: any) => (
                              <div
                                key={stackProduto.id}
                                className="border border-border rounded-lg p-3 flex items-center space-x-3"
                              >
                                <img
                                  src={
                                    stackProduto.produto.fotos[0] ||
                                    "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=32&h=32&fit=crop"
                                  }
                                  alt=""
                                  className="w-8 h-8 rounded object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {stackProduto.produto.titulo}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    R${" "}
                                    {stackProduto.produto.valorDesconto?.toFixed(
                                      2,
                                    ) ||
                                      stackProduto.produto.valorBruto.toFixed(
                                        2,
                                      )}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm">
                            Nenhum produto adicionado a esta stack
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Product Modal */}
      <Dialog open={showProductModal} onOpenChange={setShowProductModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={productForm.titulo}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    titulo: e.target.value,
                  }))
                }
                placeholder="Nome do produto"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valorBruto">Valor Bruto (R$)</Label>
                <Input
                  id="valorBruto"
                  type="number"
                  step="0.01"
                  value={productForm.valorBruto}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      valorBruto: e.target.value,
                    }))
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valorDesconto">Valor com Desconto (R$)</Label>
                <Input
                  id="valorDesconto"
                  type="number"
                  step="0.01"
                  value={productForm.valorDesconto}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      valorDesconto: e.target.value,
                    }))
                  }
                  placeholder="0.00 (opcional)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={productForm.descricao}
                onChange={(e) =>
                  setProductForm((prev) => ({
                    ...prev,
                    descricao: e.target.value,
                  }))
                }
                placeholder="Descrição detalhada do produto..."
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label>Fotos (URLs)</Label>
              {productForm.fotos.map((foto, index) => (
                <div key={index} className="flex space-x-2">
                  <Input
                    value={foto}
                    onChange={(e) => updateFotoField(index, e.target.value)}
                    placeholder="https://exemplo.com/imagem.jpg"
                    className="flex-1"
                  />
                  {productForm.fotos.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeFotoField(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addFotoField}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Foto
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowProductModal(false);
                resetProductForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleProductSubmit}
              disabled={
                createProductMutation.isPending ||
                updateProductMutation.isPending
              }
              className="btn-primary"
            >
              <Save className="h-4 w-4 mr-2" />
              {editingProduct ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stack Modal */}
      <Dialog open={showStackModal} onOpenChange={setShowStackModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStack ? "Editar Stack" : "Nova Stack"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="stack-titulo">Título</Label>
              <Input
                id="stack-titulo"
                value={stackForm.titulo}
                onChange={(e) =>
                  setStackForm((prev) => ({ ...prev, titulo: e.target.value }))
                }
                placeholder="Nome da stack"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="product-search">Adicionar Produtos</Label>
              <Input
                id="product-search"
                placeholder="Buscar produtos..."
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
              />
              <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                {produtosLoading ? (
                  <p className="text-sm text-muted-foreground">
                    Carregando produtos...
                  </p>
                ) : filteredAvailableProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum produto encontrado ou todos já adicionados.
                  </p>
                ) : (
                  filteredAvailableProducts.map((product: Produto) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="text-sm">{product.titulo}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addProductToStack(product)}
                      >
                        Adicionar
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Produtos na Stack ({selectedProducts.length})</Label>
              <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                {selectedProducts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum produto selecionado para esta stack.
                  </p>
                ) : (
                  selectedProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between py-1 border-b last:border-b-0"
                    >
                      <span className="text-sm">
                        {index + 1}. {product.titulo}
                      </span>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveProductInStack(product.id, "up")}
                          disabled={index === 0}
                        >
                          ⬆️
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveProductInStack(product.id, "down")}
                          disabled={index === selectedProducts.length - 1}
                        >
                          ⬇️
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProductFromStack(product.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowStackModal(false);
                resetStackForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleStackSubmit}
              disabled={
                createStackMutation.isPending || updateStackMutation.isPending
              }
              className="btn-primary"
            >
              <Save className="h-4 w-4 mr-2" />
              {editingStack ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reorder Stacks Modal */}
      <ReorderStacksModal
        open={showReorderModal}
        onOpenChange={setShowReorderModal}
        stacks={stacks || []}
        onSave={handleReorderStacksSave}
      />
    </div>
  );
}
