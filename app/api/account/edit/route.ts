// app/api/tasks/route.ts
import { NextResponse } from "next/server";
type Task = { id: string; title: string; done: boolean };
// MOCK em memória (reseta em dev quando o arquivo recarrega)

let tasks: Task[] = [
  { id: "1", title: "Estudar Next.js", done: false },
  { id: "2", title: "Configurar SCSS", done: true },
];
export async function GET() {
  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const { title } = await req.json();
  if (!title || !String(title).trim()) {
    return NextResponse.json({ error: "title obrigatório" }, { status: 400 });
  }
  const t: Task = { id: crypto.randomUUID(), title, done: false };
  tasks.unshift(t);
  return NextResponse.json(t, { status: 201 });
}
export async function PUT(req: Request) {
  const { id, done, title } = await req.json();
  tasks = tasks.map((t) =>
    t.id === id ? { ...t, done: done ?? t.done, title: title ?? t.title } : t
  );
  return NextResponse.json({ ok: true });
}
export async function DELETE(req: Request) {
  const { id } = await req.json();
  tasks = tasks.filter((t) => t.id != id);
  return NextResponse.json({ ok: true });
}
