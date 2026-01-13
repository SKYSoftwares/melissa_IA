'use client';

import AgnesChat from '@/components/AgnesChat';

export default function DashboardAgnesPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Agnes (IA)</h1>
      <AgnesChat />
    </div>
  );
}

