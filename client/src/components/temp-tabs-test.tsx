import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Layers, Tag } from "lucide-react";

export function TempTabsTest() {
  const [activeTab, setActiveTab] = useState("products");

  return (
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

      <TabsContent value="products" className="space-y-8">
        <div>Minimal Products Tab Content</div>
      </TabsContent>

      <TabsContent value="stacks" className="space-y-8">
        <div>Minimal Stacks Tab Content</div>
      </TabsContent>

      <TabsContent value="categories" className="space-y-8">
        <div>Minimal Categories Tab Content</div>
      </TabsContent>
    </Tabs>
  );
}