"use client";

import { useEffect, useRef, useState } from "react";
import { trpc } from "../client";
import type { Task } from "../server/appRouter";

type TaskListProps = {
  initialTasks: Task[];
  initialCursor: number | null;
};

export default function TaskList({
  initialTasks,
  initialCursor,
}: Readonly<TaskListProps>) {
  const [tasks, setTasks] = useState(initialTasks);
  const [nextCursor, setNextCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const isLoadingRef = useRef(false);

  const observerTarget = useRef<HTMLDivElement>(null);

  async function loadMoreTasks() {
    if (isLoadingRef.current || nextCursor === null) return;

    isLoadingRef.current = true;
    setLoading(true);
    setMessage("");

    try {
      const result = await trpc.taskListPaginated.query({
        cursor: nextCursor,
        limit: 10,
      });

      setTasks((currentTasks) => [...currentTasks, ...result.tasks]);

      setNextCursor(result.nextCursor);
    } catch {
      setMessage("Não foi possível carregar mais tarefas.");
    } finally {
      isLoadingRef.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    const target = observerTarget.current;

    if (!target || nextCursor === null) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void loadMoreTasks();
        }
      },
      {
        threshold: 0.1,
      },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [nextCursor, loading]);

  async function handleDelete(id: string) {
    try {
      setMessage("");

      await trpc.taskDelete.mutate(id);

      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== id));

      setMessage("Tarefa excluída com sucesso!");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a tarefa.",
      );
    }
  }

  return (
    <section>
      {message && (
        <p role="status" aria-live="polite">
          {message}
        </p>
      )}

      {tasks.length === 0 ? (
        <p>Você ainda não possui tarefas cadastradas.</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>
              <h2>{task.titulo}</h2>

              {task.descricao && <p>{task.descricao}</p>}

              <small>
                Criada em:{" "}
                {new Date(task.dataCriacao).toLocaleDateString("pt-BR")}
              </small>

              <button onClick={() => handleDelete(task.id)}>Excluir</button>
            </li>
          ))}
        </ul>
      )}

      {loading && <p>Carregando mais tarefas...</p>}

      {nextCursor !== null && <div ref={observerTarget} />}

      {nextCursor === null && tasks.length > 0 && (
        <p>Você chegou ao final da lista!</p>
      )}
    </section>
  );
}
