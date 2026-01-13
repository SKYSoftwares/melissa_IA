import { Suspense } from "react";
import RedefinirSenhaClient from "./ReedfinirSenhaClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-white/60 rounded-lg" />
              <div className="h-40 bg-white/60 rounded-lg" />
              <div className="h-10 bg-white/60 rounded-lg" />
            </div>
          </div>
        </div>
      }
    >
      <RedefinirSenhaClient />
    </Suspense>
  );
}
