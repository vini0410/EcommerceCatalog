import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { type Stack } from "@shared/schema";
import { GripVertical, Save } from "lucide-react";

interface ReorderStacksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReorderStacksModal({ open, onOpenChange }: ReorderStacksModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [orderedStacks, setOrderedStacks] = useState<Stack[]>([]);

  const { data: stacks, isLoading } = useQuery({
    queryKey: ["/api/stacks", "reorder"],
    queryFn: () => api.getStacks(true), // Fetch all stacks, including inactive
    enabled: open, // Only fetch when modal is open
  });

  useEffect(() => {
    if (stacks) {
      // Sort by current order or default to existing array order if order is not set
      setOrderedStacks([...stacks].sort((a, b) => (a.ordem || 0) - (b.ordem || 0)));
    }
  }, [stacks]);

  // reorderMutation e onDragEnd removidos

  const handleSaveOrder = () => {
    toast({
      variant: "destructive",
      title: "Funcionalidade de reordenação desabilitada",
      description: "A funcionalidade de reordenação está temporariamente desabilitada.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reordenar Stacks</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <p className="text-center text-muted-foreground">Carregando stacks...</p>
          ) : orderedStacks.length === 0 ? (
            <p className="text-center text-muted-foreground">Nenhuma stack para reordenar.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-center text-muted-foreground">Funcionalidade de arrastar e soltar desabilitada.</p>
              {orderedStacks.map((stack) => (
                <div
                  key={stack.id}
                  className="flex items-center bg-card border border-border rounded-md p-3 shadow-sm"
                >
                  <span className="mr-3 text-muted-foreground">
                    <GripVertical className="h-5 w-5" />
                  </span>
                  <span className="flex-1 font-medium text-foreground">
                    {stack.titulo}
                  </span>
                  <span className={`text-sm font-semibold ${stack.ativo ? "text-green-600" : "text-red-600"}`}>
                    {stack.ativo ? "Ativa" : "Inativa"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveOrder} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Ordem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}