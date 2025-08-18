import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save, X } from "lucide-react";
import { type Stack, type StackProduto, type Produto } from "@shared/schema";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ReorderStacksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stacks: (Stack & { produtos: (StackProduto & { produto: Produto })[] })[];
  onSave: (reorderedStacks: (Stack & { produtos: (StackProduto & { produto: Produto })[] })[]) => void;
}

interface SortableItemProps {
  stack: (Stack & { produtos: (StackProduto & { produto: Produto })[] });
}

function SortableItem({ stack }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: stack.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center justify-between p-3 border rounded-md bg-card text-card-foreground shadow-sm mb-2 cursor-grab"
    >
      <span className="font-medium">{stack.titulo}</span>
      <span className="text-sm text-muted-foreground">Ordem: {stack.ordem}</span>
    </div>
  );
}

export function ReorderStacksModal({
  open,
  onOpenChange,
  stacks,
  onSave,
}: ReorderStacksModalProps) {
  const [reorderedStacks, setReorderedStacks] = useState<(Stack & { produtos: (StackProduto & { produto: Produto })[] })[]>([]);

  useEffect(() => {
    // Initialize reorderedStacks when the modal opens or stacks prop changes
    if (open && stacks) {
      // Sort by current order to ensure consistent initial display
      setReorderedStacks([...stacks].sort((a, b) => a.ordem - b.ordem));
    }
  }, [open, stacks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setReorderedStacks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = [...items];
        const [movedItem] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, movedItem);

        // Update the 'ordem' property based on the new array index
        return newItems.map((item, index) => ({ ...item, ordem: index + 1 }));
      });
    }
  };

  const handleSave = () => {
    onSave(reorderedStacks);
    onOpenChange(false); // Close modal after saving
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reordenar Stacks</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Label>Arraste e solte para reordenar as stacks:</Label>
          <div className="border rounded-md p-3 bg-muted/40">
            {reorderedStacks.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhuma stack para reordenar.
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={reorderedStacks.map((stack) => stack.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {reorderedStacks.map((stack) => (
                    <SortableItem key={stack.id} stack={stack} />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} className="btn-primary">
            <Save className="h-4 w-4 mr-2" />
            Salvar Ordem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
