"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Settings } from "lucide-react";
import { useState } from "react";

interface PDFConfigModalProps {
  onExport: (config: { marcaEmpresa: string; logoUrl?: string }) => void;
  children: React.ReactNode;
}

export function PDFConfigModal({ onExport, children }: PDFConfigModalProps) {
  const [marcaEmpresa, setMarcaEmpresa] = useState("Zeus Capital");
  const [logoUrl, setLogoUrl] = useState("/images/zeus-capital-logo.png");
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = () => {
    onExport({
      marcaEmpresa,
      logoUrl: logoUrl || undefined,
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Configurar Exportação PDF</span>
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="marca">Nome da Empresa</Label>
            <Input
              id="marca"
              value={marcaEmpresa}
              onChange={(e) => setMarcaEmpresa(e.target.value)}
              placeholder="Digite o nome da sua empresa"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo">URL do Logo (opcional)</Label>
            <Input
              id="logo"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://exemplo.com/logo.png"
            />
            <p className="text-xs text-gray-500">
              Deixe em branco para não incluir logo no PDF
            </p>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleExport}
              className="flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>Exportar PDF</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default PDFConfigModal;
