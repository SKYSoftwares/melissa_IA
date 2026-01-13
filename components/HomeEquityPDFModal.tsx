"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";

interface HomeEquityPDFModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (nomeUsuario: string) => void;
}

export function HomeEquityPDFModal({
  isOpen,
  onClose,
  onConfirm,
}: HomeEquityPDFModalProps) {
  const { user } = useAuth();

  const handleConfirm = () => {
    const nomeUsuario = user?.name || "Usuário";
    onConfirm(nomeUsuario);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Exportar PDF - Home Equity</DialogTitle>
          <DialogDescription>
            O relatório será gerado com o nome:{" "}
            <strong>{user?.name || "Usuário"}</strong>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-green-600 hover:bg-green-700"
          >
            Gerar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
