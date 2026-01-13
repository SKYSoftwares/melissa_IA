// components/account/AvatarUploader.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner"; // se usar; senão troca por alert

type Props = {
  initialUrl?: string | null;
  name?: string | null;
};

export function AvatarUploader({ initialUrl, name }: Props) {
  const { data: session, update } = useSession();
  const [preview, setPreview] = useState<string | null>(initialUrl || null);
  const [uploading, setUploading] = useState(false);

  function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast?.error?.("Selecione uma imagem"); // opcional
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast?.error?.("Máx. 5MB");
      return;
    }

    const b64 = await readFileAsBase64(file);
    setUploading(true);
    try {
      const res = await fetch("/api/account/avatar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64: b64, mime: file.type }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Falha ao enviar");

      setPreview(json.url);

      // Atualiza session (se estiver usando jwt + next-auth >= v4.22)
      try {
        await update?.({ image: json.url });
      } catch {}
      toast?.success?.("Foto atualizada!");
    } catch (err: any) {
      console.error(err);
      toast?.error?.(err.message || "Erro ao enviar");
    } finally {
      setUploading(false);
      e.target.value = ""; // permite reenviar o mesmo arquivo
    }
  }

  const initials = (name || session?.user?.name || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 rounded-full overflow-hidden border bg-muted flex items-center justify-center">
        {preview ? (
          <Image
            src={preview}
            alt="Foto de perfil"
            fill
            className="object-cover"
          />
        ) : (
          <span className="text-lg font-semibold">{initials}</span>
        )}
      </div>

      <div className="space-y-2">
        <div className="text-sm text-muted-foreground">
          Formatos: JPG, PNG ou WEBP. Máx. 5MB.
        </div>
        <div className="flex items-center gap-3">
          <label className="inline-block">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPick}
              disabled={uploading}
            />
            <Button asChild={!uploading} variant="default" disabled={uploading}>
              <span>{uploading ? "Enviando..." : "Trocar foto"}</span>
            </Button>
          </label>
          {preview && <Badge variant="outline">Foto ativa</Badge>}
        </div>
      </div>
    </div>
  );
}
