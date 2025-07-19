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
  X
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { type Produto, type Stack } from "@shared/schema";

interface ProductFormData {
  titulo: string;
  valorBruto: string;
  valorDesconto: string;
  fotos: string[];
}

interface StackFormData {
  titulo: string;
  ordem: string;
}

export function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showProductModal, setShowProductModal] = useState(false);
  const [showStackModal, setShowStackModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [editingStack, setEditingStack] = useState<Stack | null>(null);

  const [productForm, setProductForm] = useState<ProductFormData>({
    titulo: "",
    valorBruto: "",
    valorDesconto: "",
    fotos: [""],
  });

  const [stackForm, setStackForm] = useState<StackFormData>({
    titulo: "",
    ordem: "1",
  });

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('admin-token');
    if (!token) {
      setLocation('/');
      return;
    }
  }, [setLocation]);

  // Fetch data
  const { data: produtos, isLoading: produtosLoading } = useQuery({
    queryKey: ["/api/produtos"],
    queryFn: () => api.getProdutos("", 1, 100),
  });

  const { data: stacks, isLoading: stacksLoading } = useQuery({
    queryKey: ["/api/stacks"],
    queryFn: () => api.getStacks(),
  });

  // Mutations
  const logoutMutation = useMutation({
    mutationFn: () => api.logoutAdmin(),
    onSuccess: () => {
      toast({ title: "Logout realizado com sucesso!" });
      setLocation('/');
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
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateProduto(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/produtos"] });
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
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateStack(id, data),
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

  // Form handlers
  const resetProductForm = () => {
    setProductForm({
      titulo: "",
      valorBruto: "",
      valorDesconto: "",
      fotos: [""],
    });
    setEditingProduct(null);
  };

  const resetStackForm = () => {
    setStackForm({
      titulo: "",
      ordem: "1",
    });
    setEditingStack(null);
  };

  const handleEditProduct = (produto: Produto) => {
    setEditingProduct(produto);
    setProductForm({
      titulo: produto.titulo,
      valorBruto: produto.valorBruto.toString(),
      valorDesconto: produto.valorDesconto?.toString() || "",
      fotos: produto.fotos.length > 0 ? produto.fotos : [""],
    });
    setShowProductModal(true);
  };

  const handleEditStack = (stack: Stack) => {
    setEditingStack(stack);
    setStackForm({
      titulo: stack.titulo,
      ordem: stack.ordem.toString(),
    });
    setShowStackModal(true);
  };

  const handleProductSubmit = () => {
    const data = {
      titulo: productForm.titulo,
      valorBruto: parseFloat(productForm.valorBruto),
      valorDesconto: productForm.valorDesconto ? parseFloat(productForm.valorDesconto) : undefined,
      fotos: productForm.fotos.filter(foto => foto.trim() !== ""),
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
    };

    if (editingStack) {
      updateStackMutation.mutate({ id: editingStack.id, data });
    } else {
      createStackMutation.mutate(data);
    }
  };

  const addFotoField = () => {
    setProductForm(prev => ({ ...prev, fotos: [...prev.fotos, ""] }));
  };

  const updateFotoField = (index: number, value: string) => {
    setProductForm(prev => ({
      ...prev,
      fotos: prev.fotos.map((foto, i) => i === index ? value : foto)
    }));
  };

  const removeFotoField = (index: number) => {
    setProductForm(prev => ({
      ...prev,
      fotos: prev.fotos.filter((_, i) => i !== index)
    }));
  };

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
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="bg-destructive/10 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="products" className="space-y-8">
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
                          <TableHead>Preços</TableHead>
                          <TableHead>Desconto</TableHead>
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
                                    src={produto.fotos[0] || "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=48&h=48&fit=crop"}
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
                                <div className="text-sm">
                                  <div className="font-medium text-foreground">
                                    R$ {produto.valorDesconto?.toFixed(2) || produto.valorBruto.toFixed(2)}
                                  </div>
                                  {produto.valorDesconto && (
                                    <div className="text-muted-foreground line-through">
                                      R$ {produto.valorBruto.toFixed(2)}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                {produto.descontoCalculado ? (
                                  <Badge className="btn-coral">
                                    {produto.descontoCalculado}%
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={produto.ativo ? "default" : "secondary"}
                                  className={produto.ativo ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : ""}
                                >
                                  {produto.ativo ? "Ativo" : "Inativo"}
                                </Badge>
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
                                    onClick={() => deleteProductMutation.mutate(produto.id)}
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
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-foreground">
                  Gerenciar Stacks
                </h2>
                <Button
                  onClick={() => setShowStackModal(true)}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Stack
                </Button>
              </div>

              <div className="space-y-6">
                {stacksLoading ? (
                  <Card>
                    <CardContent className="py-8">
                      <div className="text-center">Carregando stacks...</div>
                    </CardContent>
                  </Card>
                ) : !stacks?.length ? (
                  <Card>
                    <CardContent className="py-8">
                      <div className="text-center">Nenhuma stack cadastrada</div>
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
                              Ordem: {stack.ordem} • {stack.produtos.length} produtos
                            </p>
                          </div>
                          <div className="flex space-x-2">
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
                              onClick={() => deleteStackMutation.mutate(stack.id)}
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
                                  src={stackProduto.produto.fotos[0] || "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=32&h=32&fit=crop"}
                                  alt=""
                                  className="w-8 h-8 rounded object-cover"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {stackProduto.produto.titulo}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    R$ {stackProduto.produto.valorDesconto?.toFixed(2) || stackProduto.produto.valorBruto.toFixed(2)}
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
                onChange={(e) => setProductForm(prev => ({ ...prev, titulo: e.target.value }))}
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
                  onChange={(e) => setProductForm(prev => ({ ...prev, valorBruto: e.target.value }))}
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
                  onChange={(e) => setProductForm(prev => ({ ...prev, valorDesconto: e.target.value }))}
                  placeholder="0.00 (opcional)"
                />
              </div>
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
              disabled={createProductMutation.isPending || updateProductMutation.isPending}
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
        <DialogContent>
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
                onChange={(e) => setStackForm(prev => ({ ...prev, titulo: e.target.value }))}
                placeholder="Nome da stack"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stack-ordem">Ordem de Exibição</Label>
              <Input
                id="stack-ordem"
                type="number"
                min="1"
                value={stackForm.ordem}
                onChange={(e) => setStackForm(prev => ({ ...prev, ordem: e.target.value }))}
                placeholder="1"
              />
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
              disabled={createStackMutation.isPending || updateStackMutation.isPending}
              className="btn-primary"
            >
              <Save className="h-4 w-4 mr-2" />
              {editingStack ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
