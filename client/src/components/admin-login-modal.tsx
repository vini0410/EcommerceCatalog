import { useNavigate } from "react-router-dom";
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
import { loginAdmin } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface AdminLoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess: () => void;
}

export function AdminLoginModal({ open, onOpenChange, onLoginSuccess }: AdminLoginModalProps) {
  const [codigo, setCodigo] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: (codigo: string) => loginAdmin(codigo),
    onSuccess: () => {
      toast({
        title: "Login realizado com sucesso!",
        description: "Redirecionando para o painel administrativo...",
      });
      onOpenChange(false);
      setCodigo("");
      onLoginSuccess();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro no login",
        description: error.message || "Verifique o código e tente novamente.",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo.trim()) return;
    loginMutation.mutate(codigo);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      navigate("/");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
