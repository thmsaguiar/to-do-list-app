import { appRouter } from "../server/appRouter";
import TaskList from "./TaskList";

export default async function Home() {
  // Busca as tarefas diretamente no servidor
   const caller = appRouter.createCaller({});

  const result = await caller.taskListPaginated({
    cursor: 0,
    limit: 10,
  });

  return (
    <main>
      <h1>Minhas tarefas</h1>
      <p>Gerencie suas tarefas abaixo.</p>

      <TaskList
        initialTasks={result.tasks}
        initialCursor={result.nextCursor}
      />
    </main>
  );
}
