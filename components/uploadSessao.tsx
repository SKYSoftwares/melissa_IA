import { Button } from "./ui/button";

import { Upload } from "lucide-react";

type BackendFile = {
  url: string;
  originalName?: string;
  name?: string;
};

type UploadFile = File | BackendFile;

interface UploadSecaoProps {
  idx: number;
  titulo: string;
  descricao: string;
  icone: React.ReactNode;
  bg: string;
  field: string;
  files: UploadFile[];
  handleChange: (idx: number, field: string, newFiles: UploadFile[]) => void;
}

// Função utilitária para adicionar arquivos (sem duplicatas)
function addFiles(
  prevFiles: UploadFile[],
  newFiles: UploadFile[]
): UploadFile[] {
  const all = [...prevFiles, ...newFiles];

  const unique = all.filter((file, idx, arr) => {
    if ("url" in file) {
      return arr.findIndex((f) => "url" in f && f.url === file.url) === idx;
    }
    return (
      arr.findIndex(
        (f) =>
          !("url" in f) &&
          (f as File).name === (file as File).name &&
          (f as File).size === (file as File).size &&
          (f as File).lastModified === (file as File).lastModified
      ) === idx
    );
  });

  return unique;
}

// Função utilitária para remover arquivo por índice
function removeFile(files: UploadFile[], idx: number): UploadFile[] {
  return files.filter((_, i) => i !== idx);
}

export function UploadSecao({
  idx,
  titulo,
  descricao,
  icone,
  bg,
  field,
  files,
  handleChange,
}: UploadSecaoProps) {
  return (
    <div className="mb-4 p-4 border rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}
          >
            {icone}
          </div>
          <div>
            <h5 className="font-medium">{titulo}</h5>
            <p className="text-sm text-gray-600">{descricao}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {files?.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <span>✓</span>
              <span>{files.length} documento(s)</span>
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => document.getElementById(`${field}-${idx}`)?.click()}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Anexar
          </Button>
          <input
            id={`${field}-${idx}`}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            multiple
            className="hidden"
            onChange={(e) => {
              const filesInput = e.target.files;
              if (filesInput) {
                const fileArray = Array.from(filesInput) as UploadFile[];
                const newFiles = addFiles(files, fileArray); // 👈 junta
                handleChange(idx, field, newFiles);
              }
              e.target.value = ""; // limpa para poder reupar o mesmo arquivo depois
            }}
          />
        </div>
      </div>

      {files?.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, fileIdx) => (
            <div
              key={fileIdx}
              className="flex items-center gap-2 p-2 bg-gray-50 rounded"
            >
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xs">✓</span>
              </div>
              <span className="flex-1 text-sm">
                {"url" in file ? (
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-600"
                  >
                    {file.originalName || file.name}
                  </a>
                ) : (
                  file.name
                )}
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  const newFiles = removeFile(files, fileIdx);
                  handleChange(idx, field, newFiles);
                }}
              >
                🗑️
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
