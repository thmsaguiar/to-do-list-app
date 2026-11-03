import { appRouter, type Task } from "../server/appRouter";
import TaskList from "./TaskList";

export default async function Home() {
  // Busca as primeiras tarefas diretamente no servidor via caller tRPC
  const caller = appRouter.createCaller({});

  let initialTasks: Task[] = [];
  let initialCursor: number | null = null;

  try {
    const result = await caller.taskListPaginated({
      cursor: 0,
      limit: 10,
    });
    initialTasks = result.tasks;
    initialCursor = result.nextCursor;
  } catch (error) {
    console.error("Erro ao carregar tarefas iniciais:", error);
  }

  return (
    <main className="min-h-screen py-8 md:py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto flex flex-col gap-8">
      {/* Cabeçalho */}
      <header className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] p-6 md:p-8 flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b-3 border-black pb-3">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-[#FFE600] border-2 border-black inline-block" />
            <span className="font-mono text-xs font-black uppercase tracking-widest text-neutral-800">
              DESAFIO PRÁTICO // LISTA DE TAREFAS
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-lime-400 text-black font-mono font-black text-[10px] uppercase px-2 py-0.5 border border-black shadow-[1px_1px_0px_0px_#000]">
              NEXT.JS 16
            </span>
            <span className="bg-[#FFE600] text-black font-mono font-black text-[10px] uppercase px-2 py-0.5 border border-black shadow-[1px_1px_0px_0px_#000]">
              TRPC
            </span>
            <span className="bg-black text-white font-mono font-black text-[10px] uppercase px-2 py-0.5 border border-black">
              REACT 19
            </span>
          </div>
        </div>

        <div>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-black leading-tight">
            Minhas Tarefas
          </h1>
          <p className="mt-2 text-sm md:text-base font-semibold text-neutral-700">
            Painel de controle com operações diretas, confirmação de segurança, popover de edição e validação em tempo real.
          </p>
        </div>
      </header>

      {/* Lista de Tarefas */}
      <TaskList
        initialTasks={initialTasks}
        initialCursor={initialCursor}
      />

      {/* Rodapé */}
      <footer className="mt-auto border-t-3 border-black pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono font-bold text-neutral-600">
        <div>TO-DO LIST APP &copy; 2026</div>
      </footer>
    </main>
  );
}
