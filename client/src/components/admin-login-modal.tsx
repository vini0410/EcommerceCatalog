import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface AdminLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminLoginModal({ open, onOpenChange }: AdminLoginModalProps) {
  const [codigo, setCodigo] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const loginMutation = useMutation({
    mutationFn: (codigo: string) => api.loginAdmin(codigo),
    onSuccess: () => {
      toast({
        title: "Login realizado com sucesso!",
        description: "Redirecionando para o painel administrativo...",
      });
      onOpenChange(false);
      setCodigo("");
      setLocation("/admin");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Código de acesso inválido",
        description: "Verifique o código e tente novamente.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) return;
    loginMutation.mutate(codigo);
  };

  const handleCancel = () => {
    onOpenChange(false);
    setCodigo("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="text-center mb-6">
            <div className="w-16 h-16 btn-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary-foreground" />
            </div>
            <DialogTitle className="text-2xl font-bold">
              Acesso Administrativo
            </DialogTitle>
            <DialogDescription className="mt-2">
              Digite o código de acesso para entrar na área administrativa
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <Label htmlFor="access-code" className="block text-sm font-medium mb-2">
              Código de Acesso
            </Label>
            <Input
              id="access-code"
              type="password"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Digite o código..."
              disabled={loginMutation.isPending}
            />
          </div>

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
              disabled={loginMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 btn-primary"
              disabled={loginMutation.isPending || !codigo.trim()}
            >
              {loginMutation.isPending ? "Verificando..." : "Entrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
