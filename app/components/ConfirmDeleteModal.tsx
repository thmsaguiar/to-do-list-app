"use client";

import { useEffect, useRef } from "react";

export type ConfirmDeleteModalProps = {
  isOpen: boolean;
  taskTitle: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDeleteModal({
  isOpen,
  taskTitle,
  isDeleting = false,
  onConfirm,
  onCancel,
}: Readonly<ConfirmDeleteModalProps>) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Botão de cancelamento com foco ativado por padrão para evitar exclusões acidentais
    cancelButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-md bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
        {/* Header da Janela Modal */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b-3 border-black">
          <div className="flex items-center gap-2">
            <span className="bg-red-500 text-white font-black px-2 py-0.5 text-xs border-2 border-black tracking-wider">
              PERIGO
            </span>
            <h2
              id="delete-modal-title"
              className="text-lg font-black uppercase tracking-tight text-black"
            >
              Confirmar Exclusão
            </h2>
          </div>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            aria-label="Fechar modal"
            className="w-7 h-7 flex items-center justify-center font-mono font-bold bg-neutral-200 border-2 border-black hover:bg-black hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Mensagem e Detalhes da Tarefa */}
        <p className="text-sm font-bold text-neutral-800">
          Você está prestes a excluir permanentemente a seguinte tarefa:
        </p>

        <div className="my-3 p-3 bg-amber-100 border-3 border-black font-mono text-sm font-black text-black break-words">
          &quot;{taskTitle}&quot;
        </div>

        <p className="text-xs font-semibold text-neutral-600 mb-6">
          Esta operação não poderá ser desfeita. Deseja realmente prosseguir?
        </p>

        {/* Botões de Ação */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="w-full sm:w-auto px-5 py-2.5 bg-white text-black font-black uppercase text-xs border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-100 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer disabled:opacity-50"
          >
            Cancelar (ESC)
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto px-5 py-2.5 bg-red-500 text-white font-black uppercase text-xs border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:bg-red-600 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                Excluindo...
              </>
            ) : (
              "Sim, Excluir Tarefa"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

