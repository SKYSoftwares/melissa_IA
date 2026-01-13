"use client";

import { useState } from "react";
import { Bot, X, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import OptimizedAgnesChat from "./OptimizedAgnesChat";

export default function FloatingAgnes() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <>
      {/* Botão Flutuante */}
      <div
        className="fixed bottom-6 right-6 z-50"
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 9999,
        }}
      >
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          style={{
            background: "linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)",
            boxShadow: "0 8px 32px rgba(139, 92, 246, 0.3)",
            border: "none",
            color: "white",
            fontSize: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: "56px",
            minHeight: "56px",
            borderRadius: "50%",
            cursor: "pointer",
            transition: "all 0.3s ease",
            animation: "pulse 2s infinite",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.boxShadow =
              "0 12px 40px rgba(139, 92, 246, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow =
              "0 8px 32px rgba(139, 92, 246, 0.3)";
          }}
        >
          <Bot className="h-6 w-6" />
        </Button>

        {/* Tooltip */}
        <div
          className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            whiteSpace: "nowrap",
            fontSize: "12px",
            fontWeight: "500",
          }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-3 w-3" />
            Agnes - IA Assistente
          </div>
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>

      {/* Modal da Agnes */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] p-0"
          style={{
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.1)",
          }}
        >
          <DialogHeader
            className="p-6 pb-4"
            style={{
              background: "linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)",
              color: "white",
              borderRadius: "16px 16px 0 0",
              margin: 0,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white/20">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold">
                    Agnes - IA Assistente
                  </DialogTitle>
                  <p className="text-sm opacity-90 mt-1">
                    Sua assistente inteligente para WhatsApp
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="p-6">
            <OptimizedAgnesChat />
          </div>
        </DialogContent>
      </Dialog>

      {/* CSS para animação */}
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </>
  );
}
