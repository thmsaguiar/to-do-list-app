"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { trpc } from "../client";
import type { Task } from "../server/appRouter";
import Toast, { ToastType } from "./components/Toast";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";
import TaskFormPopover from "./components/TaskFormPopover";

type TaskListProps = {
  initialTasks: Task[];
  initialCursor: number | null;
};

type ToastState = {
  message: string;
  type: ToastType;
} | null;

export default function TaskList({
  initialTasks,
  initialCursor,
}: Readonly<TaskListProps>) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [nextCursor, setNextCursor] = useState<number | null>(initialCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Estado do Toast de notificação superior central
  const [toast, setToast] = useState<ToastState>(null);

  // Estado do Modal de Confirmação de Exclusão
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estado do Popover de Criação / Edição
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const isLoadingRef = useRef(false);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Dispara o toast no canto superior central com tempo limite
  const showToast = (message: string, type: ToastType = "info") => {
    setToast({ message, type });
  };

  // Carregar mais tarefas ao rolar (Infinite Scroll)
  async function loadMoreTasks() {
    if (isLoadingRef.current || nextCursor === null) return;

    isLoadingRef.current = true;
    setLoadingMore(true);

    try {
      const result = await trpc.taskListPaginated.query({
        cursor: nextCursor,
        limit: 10,
      });

      setTasks((prevTasks) => {
        // Evita duplicatas caso tarefas tenham sido adicionadas localmente
        const existingIds = new Set(prevTasks.map((t) => t.id));
        const newTasks = result.tasks.filter((t) => !existingIds.has(t.id));
        return [...prevTasks, ...newTasks];
      });

      setNextCursor(result.nextCursor);
    } catch (error: unknown) {
      const errorMsg =
        error instanceof Error
          ? error.message
          : "Não foi possível carregar mais tarefas.";
      showToast(errorMsg, "error");
    } finally {
      isLoadingRef.current = false;
      setLoadingMore(false);
    }
  }

  // Observer para paginação contínua
  useEffect(() => {
    const target = observerTarget.current;
    if (!target || nextCursor === null) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void loadMoreTasks();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [nextCursor, loadingMore]);

  // Abertura do modal de confirmação de exclusão
  const requestDelete = (task: Task) => {
    setTaskToDelete(task);
  };

  // Execução da exclusão após confirmação no modal
  async function confirmDelete() {
    if (!taskToDelete) return;

    setIsDeleting(true);
    try {
      await trpc.taskDelete.mutate(taskToDelete.id);

      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      showToast(`Tarefa "${taskToDelete.titulo}" excluída com sucesso!`, "success");
      setTaskToDelete(null);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao tentar excluir a tarefa no servidor.";
      showToast(message, "error");
    } finally {
      setIsDeleting(false);
    }
  }

  // Handlers para abrir Popover de Criação / Edição
  const handleOpenCreate = () => {
    setTaskToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (task: Task) => {
    setTaskToEdit(task);
    setIsFormOpen(true);
  };

  // Sucesso na criação ou edição no Popover
  const handleFormSuccess = (task: Task, mode: "create" | "update") => {
    if (mode === "create") {
      setTasks((prev) => [task, ...prev]);
      showToast("Tarefa criada com sucesso!", "success");
    } else {
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
      showToast("Tarefa atualizada com sucesso!", "success");
    }
  };

  // Filtragem local por busca
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const query = searchQuery.toLowerCase().trim();
    return tasks.filter(
      (t) =>
        t.titulo.toLowerCase().includes(query) ||
        (t.descricao?.toLowerCase().includes(query)),
    );
  }, [tasks, searchQuery]);

  return (
    <section className="w-full">
      {/* Toast no canto superior central com tempo limite */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={4000}
          onClose={() => setToast(null)}
        />
      )}

      {/* Modal Popup de confirmação de exclusão */}
      <ConfirmDeleteModal
        isOpen={Boolean(taskToDelete)}
        taskTitle={taskToDelete?.titulo ?? ""}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setTaskToDelete(null)}
      />

      {/* Popover de Criação/Atualização de tarefas */}
      <TaskFormPopover
        isOpen={isFormOpen}
        taskToEdit={taskToEdit}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
        onError={(errMsg) => showToast(errMsg, "error")}
      />

      <div className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_#000] p-4 md:p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Busca */}
          <div className="relative flex-1">
            <label htmlFor="search-input" className="sr-only">
              Pesquisar tarefas
            </label>
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 PESQUISAR TAREFA..."
              className="w-full px-4 py-2.5 bg-neutral-100 font-mono text-xs md:text-sm font-bold border-3 border-black text-black placeholder:text-neutral-500 focus:outline-none focus:bg-white focus:border-b-4 focus:border-b-[#FFE600] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 font-mono font-bold text-xs bg-black text-white px-1.5 py-0.5 hover:bg-neutral-800"
              >
                LIMPAR
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Contador de tarefas */}
            <div className="bg-[#FFE600] border-3 border-black px-3 py-2 font-mono font-black text-xs uppercase shadow-[2px_2px_0px_0px_#000]">
              TOTAL: {filteredTasks.length}{" "}
              {filteredTasks.length === 1 ? "TAREFA" : "TAREFAS"}
            </div>

            {/* Botão Nova Tarfea */}
            <button
              onClick={handleOpenCreate}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-lime-400 text-black font-black uppercase text-xs md:text-sm border-3 border-black shadow-[4px_4px_0px_0px_#000] hover:bg-lime-300 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-[1px_1px_0px_0px_#000] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="text-base leading-none font-black">+</span>
              <span>NOVA TAREFA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Tarefas*/}
      {filteredTasks.length === 0 ? (
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] p-8 text-center my-6">
          <h2 className="text-xl font-black uppercase tracking-tight text-black mb-2">
            {searchQuery
              ? "Nenhuma tarefa encontrada para esta busca"
              : "Nenhuma tarefa cadastrada ainda"}
          </h2>
          <p className="font-mono text-xs md:text-sm text-neutral-600 max-w-md mx-auto mb-6">
            {searchQuery
              ? "Tente buscar com outro termo ou limpe a pesquisa."
              : "Crie sua primeira tarefa clicando no botão abaixo para começar a organizar sua rotina."}
          </p>

          {!searchQuery && (
            <button
              onClick={handleOpenCreate}
              className="px-6 py-3 bg-[#FFE600] text-black font-black uppercase text-xs md:text-sm border-3 border-black shadow-[4px_4px_0px_0px_#000] hover:bg-amber-300 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000] transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <span>+ CRIAR PRIMEIRA TAREFA</span>
            </button>
          )}
        </div>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-5 list-none p-0 m-0">
          {filteredTasks.map((task, index) => (
            <li
              key={task.id}
              className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              <div>
                {/* Header do Card da Tarefa */}
                <div className="border-b-3 border-black bg-neutral-100 px-4 py-2.5 flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-mono font-black text-[11px] uppercase bg-black text-white px-2 py-0.5">
                    #{index + 1}
                  </span>

                  <span className="font-mono text-[11px] font-bold text-neutral-600 flex items-center gap-1">
                    <span>CRIADA EM:</span>
                    <strong className="text-black">
                      {new Date(task.dataCriacao).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </strong>
                  </span>
                </div>

                {/* Conteúdo da Tarefa */}
                <div className="p-5">
                  <h3 className="text-lg md:text-xl font-black text-black leading-snug tracking-tight mb-2 break-words">
                    {task.titulo}
                  </h3>

                  {task.descricao ? (
                    <p className="font-sans text-sm font-medium text-neutral-700 whitespace-pre-wrap break-words border-l-4 border-[#FFE600] pl-3 py-1 my-2 bg-neutral-50/60">
                      {task.descricao}
                    </p>
                  ) : (
                    <p className="font-mono text-xs italic text-neutral-400 my-2">
                      Sem descrição adicional.
                    </p>
                  )}
                </div>
              </div>

              {/* Botões de Ação no Rodapé do Card */}
              <div className="border-t-3 border-black bg-neutral-50 px-4 py-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(task)}
                  className="px-3.5 py-1.5 bg-[#FFE600] text-black font-black uppercase text-xs border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:bg-amber-300 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000] transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>✏️</span>
                  <span>EDITAR</span>
                </button>

                <button
                  type="button"
                  onClick={() => requestDelete(task)}
                  className="px-3.5 py-1.5 bg-red-400 text-black font-black uppercase text-xs border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:bg-red-500 hover:text-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000] transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>🗑️</span>
                  <span>EXCLUIR</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Loading para o Infinite Scroll */}
      {loadingMore && (
        <div className="my-6 p-4 bg-white border-3 border-black shadow-[4px_4px_0px_0px_#000] flex items-center justify-center gap-3">
          <span className="w-4 h-4 border-3 border-black border-t-transparent animate-spin rounded-full" />
          <span className="font-mono text-xs font-black uppercase tracking-wider">
            Carregando mais tarefas do servidor...
          </span>
        </div>
      )}

      {/* Trigger do Intersection Observer */}
      {nextCursor !== null && <div ref={observerTarget} className="h-6" />}

      {/* Fim da Lista */}
      {nextCursor === null && tasks.length > 0 && (
        <div className="mt-8 mb-4 text-center">
          <span className="inline-block px-4 py-1.5 bg-neutral-200 border-2 border-black font-mono text-xs font-black uppercase tracking-wider text-neutral-800">
            ✓ TODAS AS TAREFAS FORAM CARREGADAS
          </span>
        </div>
      )}
    </section>
  );
}
