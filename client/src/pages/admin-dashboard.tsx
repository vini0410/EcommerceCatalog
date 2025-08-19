

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/pagination";

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
  Tag,
  ImageIcon,
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { capitalize } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { type Produto, type Stack, type StackProduto, type Categoria } from "@shared/schema";
import { ReorderStacksModal } from "@/components/reorder-stacks-modal";
import { ProductModal } from "@/components/product-modal";
import { supabase } from "@/lib/supabase";
import { SUPABASE_BUCKET_PRODUTOS } from "@shared/constants";

interface ProductFormData {
  titulo: string;
  valorBruto: string;
  valorDesconto: string;
  descricao: string;
  fotos: (string | File)[]; // Aceita URLs (string) ou novos arquivos (File)
  categoriaIds: string[];
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

interface CategoryFormData {
  titulo: string;
  descricao: string;
  color: string;
}

export function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(100);

  const [showProductModal, setShowProductModal] = useState(false);
  const [showStackModal, setShowStackModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [editingStack, setEditingStack] = useState<(
    Stack &
    { produtos: (StackProduto & { produto: Produto })[] }
  ) | null>(null);
  const [editingCategory, setEditingCategory] = useState<Categoria | null>(null);
  const [activeTab, setActiveTab] = useState("products");

  const [productForm, setProductForm] = useState<ProductFormData>({
    titulo: "",
    valorBruto: "",
    valorDesconto: "",
    descricao: "",
    fotos: [],
    categoriaIds: [],
  });

  const [stackForm, setStackForm] = useState<StackFormData>({
    titulo: "",
    ordem: "1",
    produtos: [],
  });
  const [productSearchTerm, setProductSearchTerm] = useState("");

  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    titulo: "",
    descricao: "",
    color: "#000000",
  });

  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    [],
  );

  

  // Reset selected products when stack modal is closed or a new stack is being created
  useEffect(() => {
    if (!showStackModal) {
      setSelectedProducts([]);
      setProductSearchTerm("");
    }
  }, [showStackModal]);

  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const [selectedAdminCategories, setSelectedAdminCategories] = useState<string[]>([]);

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

  const { data: produtos, isLoading: produtosLoading } = useQuery({
    queryKey: ["/api/produtos", currentPage, itemsPerPage, adminSearchQuery, selectedAdminCategories],
    queryFn: () => api.getProdutos(adminSearchQuery, currentPage, itemsPerPage, undefined, selectedAdminCategories.join(','), true),
  });

  const { data: allProdutos, isLoading: allProdutosLoading } = useQuery({
    queryKey: ["/api/produtos/all"],
    queryFn: () => api.getProdutos("", 1, 9999, undefined, undefined, true), // Fetch all for the modal
    enabled: showStackModal, // Only fetch when the stack modal is open
  });

  const { data: stacks, isLoading: stacksLoading } = useQuery<(
    Stack &
    { produtos: (StackProduto & { produto: Produto })[] }
  )[]>({
    queryKey: ["/api/stacks", activeTab],
    queryFn: () => api.getStacks(true),
    enabled: activeTab === "stacks",
  });

  const { data: categorias, isLoading: categoriasLoading } = useQuery<Categoria[]>({
    queryKey: ["/api/categorias"],
    // Fetch all categories (including inactive) for management purposes
    queryFn: () => api.getCategorias(true),
    enabled: activeTab === "products" || activeTab === "categories" || showProductModal, // Fetch for the categories tab or when the product modal is open
  });

  // Mutations
  const logoutMutation = useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      toast({ title: "Logout realizado com sucesso!" });
      navigate("/");
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

  const createCategoryMutation = useMutation({
    mutationFn: (data: CategoryFormData) => api.createCategoria(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categorias"] });
      setShowCategoryModal(false);
      resetCategoryForm();
      toast({ title: "Categoria criada com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar categoria",
        description: error.message,
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CategoryFormData> }) =>
      api.updateCategoria(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categorias"] });
      setShowCategoryModal(false);
      resetCategoryForm();
      toast({ title: "Categoria atualizada com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar categoria",
        description: error.message,
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => api.deleteCategoria(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categorias"] });
      toast({ title: "Categoria removida com sucesso!" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erro ao remover categoria", description: error.message });
    },
  });

  const toggleCategoryStatusMutation = useMutation({
    mutationFn: (id: string) => api.toggleCategoriaStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categorias"] });
      toast({ title: "Status da categoria atualizado com sucesso!" });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Erro ao atualizar status da categoria", description: error.message });
    },
  });

  const reorderStacksMutation = useMutation({
    mutationFn: (data: { id: string; ordem: number }[]) =>
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

  const handleReorderStacksSave = (reorderedStacks: (Stack & { produtos: (StackProduto & { produto: Produto; })[]; })[]) => {
    const data = reorderedStacks.map((stack) => ({
      id: stack.id,
      ordem: stack.ordem,
    }));
    reorderStacksMutation.mutate(data);
  };

  // Form handlers
  const resetProductForm = () => {
    setProductForm({
      titulo: "",
      valorBruto: "",
      valorDesconto: "",
      descricao: "",
      fotos: [],
      categoriaIds: [],
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

  const resetCategoryForm = () => {
    setCategoryForm({ titulo: "", descricao: "", color: "#000000" });
    setEditingCategory(null);
  };

  const handleEditProduct = async (produto: Produto) => {
    setEditingProduct(produto);

    const fullProduct = await queryClient.fetchQuery({
      queryKey: ["/api/produtos", produto.id],
      queryFn: () => api.getProdutoById(produto.id),
    });

    setProductForm({
      titulo: fullProduct.titulo,
      valorBruto: fullProduct.valorBruto.toString(),
      valorDesconto: fullProduct.valorDesconto?.toString() || "",
      descricao: fullProduct.descricao || "",
      fotos: fullProduct.fotos || [],
      categoriaIds: fullProduct.categorias.map(c => c.id) || [],
    });
    setShowProductModal(true);
  };

  const handleEditCategory = (categoria: Categoria) => {
    setEditingCategory(categoria);
    setCategoryForm({
      titulo: categoria.titulo,
      descricao: categoria.descricao || "",
      color: categoria.color || "#000000",
    });
    setShowCategoryModal(true);
  };

  const handleEditStack = (stack: (Stack & { produtos: (StackProduto & { produto: Produto; })[]; })) => {
    setEditingStack(stack);
    setStackForm({
      titulo: stack.titulo,
      ordem: stack.ordem.toString(),
      produtos: [], // This will be populated by the useEffect
    });
    setShowStackModal(true);
  };

  const handleProductSubmit = async () => {
    const parseLocaleNumber = (str: string | undefined | null): number | undefined => {
      if (!str) return undefined;
      // Remove pontos de milhar, depois troca a vírgula decimal por ponto
      const value = parseFloat(str.replace(/\./g, '').replace(',', '.'));
      return isNaN(value) ? undefined : value;
    };

    const valorBrutoNum = parseLocaleNumber(productForm.valorBruto);

    if (valorBrutoNum === undefined) {
      toast({
        variant: "destructive",
        title: "Valor Bruto inválido",
        description: "Por favor, insira um número válido para o valor bruto (ex: 19,99).",
      });
      return;
    }

    const uploadedImageUrls: string[] = [];

    for (const foto of productForm.fotos) {
      if (typeof foto === 'string') {
        // Se já é uma URL, apenas adiciona
        uploadedImageUrls.push(foto);
      } else {
        // Se é um File, faz o upload para o Supabase Storage
        const fileName = `${Date.now()}-${foto.name}`;
        const { data, error } = await supabase.storage.from(
          SUPABASE_BUCKET_PRODUTOS,
        )
          .upload(fileName, foto, { cacheControl: '3600', upsert: false });

        if (error) {
          toast({
            variant: "destructive",
            title: "Erro ao fazer upload da imagem",
            description: error.message,
          });
          return; // Interrompe a submissão se houver erro no upload
        }
        // Constrói a URL pública da imagem
        const publicUrl = supabase.storage
          .from(SUPABASE_BUCKET_PRODUTOS)
          .getPublicUrl(data.path).data.publicUrl;
        uploadedImageUrls.push(publicUrl);
      }
    }

    const data = {
      titulo: productForm.titulo,
      valorBruto: valorBrutoNum,
      valorDesconto: parseLocaleNumber(productForm.valorDesconto),
      descricao: productForm.descricao,
      fotos: uploadedImageUrls, // Envia as URLs finais para a API
      categoriaIds: productForm.categoriaIds,
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

  const handleCategorySubmit = () => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data: categoryForm });
    } else {
      createCategoryMutation.mutate(categoryForm);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setProductForm((prev) => ({
        ...prev,
        fotos: [...prev.fotos, ...newFiles],
      }));
    }
  };

  const removeFoto = (indexToRemove: number) => {
    setProductForm((prev) => ({
      ...prev,
      fotos: prev.fotos.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleCategoryCheckedChange = (categoryId: string, checked: boolean) => {
    setProductForm(prev => {
      const newCategoriaIds = checked
        ? [...prev.categoriaIds, categoryId]
        : prev.categoriaIds.filter(id => id !== categoryId);
      return { ...prev, categoriaIds: newCategoriaIds };
    });
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
    allProdutos?.produtos.filter(
      (product: { titulo: string; id: string; }) =>
        product.titulo
          .toLowerCase()
          .includes(productSearchTerm.toLowerCase()) &&
        !selectedProducts.some((p) => p.id === product.id),
    ) || [];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPages = produtos ? Math.ceil(produtos.total / itemsPerPage) : 0;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="gradient-bg py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-4">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              ⚙️ Painel <span className="text-gradient">Administrativo</span>
            </h1>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              Gerencie produtos e stacks do seu catálogo
            </p>
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
            <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3">
              <TabsTrigger value="products" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Produtos
              </TabsTrigger>
              <TabsTrigger value="stacks" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Stacks
              </TabsTrigger>
              <TabsTrigger value="categories" className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Categorias
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

              <div className="flex justify-between items-center mb-8">
                <div className="w-full max-w-sm">
                  <Input
                    placeholder="Buscar por nome ou ID do produto..."
                    value={adminSearchQuery}
                    onChange={(e) => setAdminSearchQuery(e.target.value)}
                  />
                </div>
                {totalPages > 0 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={produtos?.total || 0}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={(value) => setItemsPerPage(value)}
                    showPerPageSelector={true}
                    itemsPerPageOptions={[20, 50, 100, 500]}
                  />
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8 items-start">
                <aside className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Filtros</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold mb-2">Categorias</h3>
                        <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                          {categoriasLoading ? (
                            <p className="text-sm text-muted-foreground">Carregando...</p>
                          ) : (
                            categorias?.map(categoria => (
                              <div key={categoria.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`admin-cat-${categoria.id}`}
                                  checked={selectedAdminCategories.includes(categoria.id)}
                                  onCheckedChange={(checked) => {
                                    setSelectedAdminCategories(prev =>
                                      checked
                                        ? [...prev, categoria.id]
                                        : prev.filter(id => id !== categoria.id)
                                    );
                                  }}
                                />
                                <label
                                  htmlFor={`admin-cat-${categoria.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {capitalize(categoria.titulo)}
                                </label>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </aside>

                {/* Main Content */}
                <main className="space-y-8">
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
                                  Nenhum produto encontrado para os filtros selecionados.
                                </TableCell>
                              </TableRow>
                            ) : (
                              produtos.produtos.map((produto: Produto) => (
                                <TableRow key={produto.id}>
                                  <TableCell>
                                    <div className="flex items-center space-x-3">
                                      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                                        {produto.fotos && produto.fotos.length > 0 ? (
                                          <img
                                            src={produto.fotos[0]}
                                            alt=""
                                            className="w-full h-full rounded-lg object-cover"
                                          />
                                        ) : (
                                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                        )}
                                      </div>
                                      <div>
                                        <div className="font-medium text-foreground">
                                          {capitalize(produto.titulo)}
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

                  {totalPages > 0 && (
                    <div className="flex justify-center">
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        itemsPerPage={itemsPerPage}
                        totalItems={produtos?.total || 0}
                        onPageChange={handlePageChange}
                        onItemsPerPageChange={(value) => setItemsPerPage(value)}
                        showPerPageSelector={true}
                        itemsPerPageOptions={[20, 50, 100, 500]}
                      />
                    </div>
                  )}
                </main>
              </div>
            </TabsContent>

            {/* Stacks Tab */}            <TabsContent value="stacks" className="space-y-8">              <div className="flex justify-between items-center mb-4">                <h2 className="text-2xl font-bold text-foreground">                  Gerenciar Stacks                </h2>                <div className="flex space-x-2">                  <Button                    onClick={() => setShowReorderModal(true)}                    variant="outline"                  >                    Reordenar Stacks                  </Button>                  <Button                    onClick={() => setShowStackModal(true)}                    className="btn-primary"                  >                    <Plus className="h-4 w-4 mr-2" />                    Nova Stack                  </Button>                </div>              </div>              <div className="space-y-6">                {stacksLoading ? (                  <Card>                    <CardContent className="py-8">                      <div className="text-center">Carregando stacks...</div>                    </CardContent>                  </Card>                ) : !stacks?.length || !stacks ? (                  <Card>                    <CardContent className="py-8">                      <div className="text-center">                        Nenhuma stack cadastrada                      </div>                    </CardContent>                  </Card>                ) : (                  stacks.map((stack: any) => (                    <Card key={stack.id}>                      <CardHeader>                        <div className="flex justify-between items-start">                          <div>                            <CardTitle className="text-xl font-semibold">                              {capitalize(stack.titulo)}                            </CardTitle>                            <p className="text-sm text-muted-foreground">                              Ordem: {stack.ordem} • {stack.produtos.length}                              produtos                            </p>                          </div>                          <div className="flex space-x-2">                            <Button                              variant="outline"                              size="sm"                              onClick={() =>                                navigate(`/produtos?stackId=${stack.id}`)                              }                            >                              Ver Produtos                            </Button>                            <Button                              variant="outline"                              size="sm"                              onClick={() =>                                toggleStackStatusMutation.mutate(stack.id)                              }                              className={                                stack.ativo                                  ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"                                  : "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"                              }                            >                              {stack.ativo ? "Ativa" : "Inativa"}                            </Button>                            <Button                              variant="ghost"                              size="sm"                              onClick={() => handleEditStack(stack)}                            >                              <Edit className="h-4 w-4" />                            </Button>                            <Button                              variant="ghost"                              size="sm"                              onClick={() =>                                deleteStackMutation.mutate(stack.id)                              }                              className="text-destructive hover:text-destructive"                            >                              <Trash2 className="h-4 w-4" />                            </Button>                          </div>                        </div>                      </CardHeader>                      <CardContent>                        {stack.produtos.length > 0 ? (                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">                            {stack.produtos.map((stackProduto: any) => (                              <div                                key={stackProduto.id}                                className="border border-border rounded-lg p-3 flex items-center space-x-3"                              >                                <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center flex-shrink-0">                                  {stackProduto.produto.fotos && stackProduto.produto.fotos.length > 0 ? (                                    <img                                      src={stackProduto.produto.fotos[0]}                                      alt=""                                      className="w-full h-full rounded object-cover"                                    />                                  ) : (                                    <ImageIcon className="w-4 h-4 text-muted-foreground" />                                  )}                                </div>                                <div className="flex-1 min-w-0">                                  <p className="text-sm font-medium text-foreground truncate">                                    {stackProduto.produto.titulo}                                  </p>                                  <p className="text-xs text-muted-foreground">                                    R$                                    {stackProduto.produto.valorDesconto?.toFixed(                                      2,                                    ) ||                                      stackProduto.produto.valorBruto.toFixed(                                        2,                                      )}                                  </p>                                </div>                              </div>                            ))}                          </div>                        ) : (                          <p className="text-muted-foreground text-sm">                            Nenhum produto adicionado a esta stack                          </p>                        )}                      </CardContent>                    </Card>                  ))                )}              </div>            </TabsContent>

            {/* Categories Tab */}
            <TabsContent value="categories" className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-foreground">
                  Gerenciar Categorias
                </h2>
                <Button
                  onClick={() => setShowCategoryModal(true)}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Categoria
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Título</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Cor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categoriasLoading ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">
                              Carregando categorias...
                            </TableCell>
                          </TableRow>
                        ) : !categorias?.length ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">
                              Nenhuma categoria cadastrada
                            </TableCell>
                          </TableRow>
                        ) : (
                          categorias.map((categoria: Categoria) => (
                            <TableRow key={categoria.id}>
                              <TableCell className="font-medium">{capitalize(categoria.titulo)}</TableCell>
                              <TableCell className="text-muted-foreground max-w-xs truncate">{categoria.descricao || "-"}</TableCell>
                              <TableCell>
                                {categoria.color && (
                                  <div
                                    className="w-6 h-6 rounded-full border border-gray-300"
                                    style={{ backgroundColor: categoria.color }}
                                    title={categoria.color}
                                  ></div>
                                )}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleCategoryStatusMutation.mutate(categoria.id)}
                                  className={categoria.ativo ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800" : "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"}
                                >
                                  {categoria.ativo ? "Ativa" : "Inativa"}
                                </Button>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button variant="ghost" size="sm" onClick={() => handleEditCategory(categoria)}>
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" onClick={() => deleteCategoryMutation.mutate(categoria.id)} className="text-destructive hover:text-destructive">
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
                  type="text"
                  inputMode="decimal"
                  value={productForm.valorBruto}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      valorBruto: e.target.value,
                    }))
                  }
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="valorDesconto">Valor com Desconto (R$)</Label>
                <Input
                  id="valorDesconto"
                  type="text"
                  inputMode="decimal"
                  value={productForm.valorDesconto}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      valorDesconto: e.target.value,
                    }))
                  }
                  placeholder="0,00 (opcional)"
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
              <Label htmlFor="fotos">Fotos</Label>
              <Input
                id="fotos"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
              />
              <div className="mt-2 grid grid-cols-3 gap-2">
                {productForm.fotos.map((foto, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={typeof foto === 'string' ? foto : URL.createObjectURL(foto)}
                      alt={`Imagem ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeFoto(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Categorias</Label>
              <div className="max-h-40 overflow-y-auto space-y-2 rounded-md border p-4">
                {categorias?.filter(c => c.ativo || productForm.categoriaIds.includes(c.id)).map(categoria => (
                  <div key={categoria.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cat-${categoria.id}`}
                      checked={productForm.categoriaIds.includes(categoria.id)}
                      onCheckedChange={(checked) => handleCategoryCheckedChange(categoria.id, !!checked)}
                    />
                    <label
                      htmlFor={`cat-${categoria.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {capitalize(categoria.titulo)}
                    </label>
                  </div>
                ))}
              </div>
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

      {/* Category Modal */}
      <Dialog open={showCategoryModal} onOpenChange={(isOpen) => {
        setShowCategoryModal(isOpen);
        if (!isOpen) resetCategoryForm();
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="cat-titulo">Título</Label>
              <Input
                id="cat-titulo"
                value={categoryForm.titulo}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, titulo: e.target.value }))}
                placeholder="Nome da categoria"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-descricao">Descrição</Label>
              <Textarea
                id="cat-descricao"
                value={categoryForm.descricao}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descrição (opcional)"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-color">Cor</Label>
              <Input
                id="cat-color"
                type="color"
                value={categoryForm.color}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                className="w-10 h-10 p-0 rounded-full cursor-pointer"
                style={{ border: 'none' }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCategoryModal(false);
                resetCategoryForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCategorySubmit}
              disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
              className="btn-primary"
            >
              <Save className="h-4 w-4 mr-2" />
              {editingCategory ? "Atualizar" : "Criar"}
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
                {allProdutosLoading ? (
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
