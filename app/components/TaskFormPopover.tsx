"use client";

import { useEffect, useRef, useState, useId } from "react";
import type { Task } from "../../server/appRouter";
import { trpc } from "../../client";

export type TaskFormPopoverProps = {
  isOpen: boolean;
  taskToEdit?: Task | null;
  onClose: () => void;
  onSuccess: (task: Task, mode: "create" | "update") => void;
  onError: (errorMessage: string) => void;
};

export default function TaskFormPopover({
  isOpen,
  taskToEdit,
  onClose,
  onSuccess,
  onError,
}: Readonly<TaskFormPopoverProps>) {
  const isEditing = Boolean(taskToEdit);

  // Form State gerenciado por hooks
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const tituloInputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const tituloId = useId();
  const descricaoId = useId();

  // Reset ou inicializa os dados ao abrir ou alternar tarefa
  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        setTitulo(taskToEdit.titulo);
        setDescricao(taskToEdit.descricao ?? "");
      } else {
        setTitulo("");
        setDescricao("");
      }
      setHasInteracted(false);
      setFormError(null);

      // Auto-foco no campo obrigatório após render
      setTimeout(() => {
        tituloInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, taskToEdit]);

  // Fecha ao teclar ESC ou clicar fora
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !isSubmitting
      ) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, isSubmitting, onClose]);

  // Validação em tempo real
  const isTituloValid = titulo.trim().length > 0;
  const isFormValid = isTituloValid;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setHasInteracted(true);

    if (!isFormValid) {
      setFormError("O título da tarefa é obrigatório.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      if (isEditing && taskToEdit) {
        // Atualizar Tarefa existente
        const updated = await trpc.taskUpdate.mutate({
          id: taskToEdit.id,
          titulo: titulo.trim(),
          descricao: descricao.trim() ? descricao.trim() : undefined,
        });

        onSuccess(updated, "update");
      } else {
        // Criar Nova Tarefa
        const created = await trpc.taskCreate.mutate({
          titulo: titulo.trim(),
          descricao: descricao.trim() ? descricao.trim() : undefined,
        });

        onSuccess(created, "create");
      }
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao processar a tarefa no servidor.";
      setFormError(errorMsg);
      onError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="popover-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
    >
      <div
        ref={popoverRef}
        className="w-full max-w-lg bg-white border-4 border-black shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
      >
        {/* Barra superior estilo Popover */}
        <div className="bg-[#FFE600] border-b-4 border-black px-4 py-3 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-black border border-black inline-block" />
            <h2
              id="popover-title"
              className="font-black uppercase tracking-wider text-base text-black"
            >
              {isEditing ? "Editar Tarefa" : "Criar Nova Tarefa"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Fechar popover"
            className="w-8 h-8 flex items-center justify-center font-mono font-black text-sm bg-black text-white hover:bg-neutral-800 transition-colors cursor-pointer border-2 border-black disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Mensagem de Erro Geral se houver */}
        {formError && (
          <div className="m-4 mb-0 p-3 bg-red-400 text-black border-3 border-black font-bold text-xs uppercase flex items-center gap-2">
            <span className="bg-black text-white px-1.5 py-0.5 text-[10px] font-black">
              ERRO
            </span>
            <span>{formError}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Campo Título */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor={tituloId}
                className="font-black text-xs uppercase tracking-wider text-black flex items-center gap-1.5"
              >
                <span>Título da Tarefa</span>
              </label>

              {/* Representação visual do campo obrigatório */}
              <span className="bg-red-500 text-white font-mono font-black text-[10px] uppercase px-2 py-0.5 border border-black shadow-[1px_1px_0px_0px_#000]">
                * Obrigatório
              </span>
            </div>

            <div className="relative">
              <input
                id={tituloId}
                ref={tituloInputRef}
                type="text"
                value={titulo}
                onChange={(e) => {
                  setTitulo(e.target.value);
                  setHasInteracted(true);
                  if (formError) setFormError(null);
                }}
                disabled={isSubmitting}
                placeholder="Ex: Entregar relatório trimestral..."
                className={`w-full px-3.5 py-2.5 font-bold text-sm text-black placeholder:text-neutral-400 border-3 border-black focus:outline-none transition-colors duration-150 ${
                  isTituloValid
                    ? "border-b-4 border-b-emerald-500 bg-emerald-50/40 focus:bg-emerald-50/60"
                    : hasInteracted || titulo.length > 0
                      ? "border-b-4 border-b-red-500 bg-red-50/30 focus:bg-red-50/50"
                      : "border-b-4 border-b-neutral-400 bg-neutral-50 focus:bg-white"
                }`}
              />
            </div>

            {/* Linha/Mensagem de validação enquanto o usuário digita */}
            <div className="min-h-5 text-xs font-mono font-bold flex items-center gap-1">
              {isTituloValid ? (
                <span className="text-emerald-700 flex items-center gap-1">
                  <span className="inline-block w-4 h-4 rounded-none bg-emerald-600 text-white text-[10px] text-center font-black leading-4">
                    ✓
                  </span>
                  Título válido ({titulo.trim().length}{" "}
                  {titulo.trim().length === 1 ? "caractere" : "caracteres"})
                </span>
              ) : hasInteracted || titulo.length > 0 ? (
                <span className="text-red-600 flex items-center gap-1">
                  <span className="inline-block w-4 h-4 rounded-none bg-red-600 text-white text-[10px] text-center font-black leading-4">
                    ✕
                  </span>
                  O título não pode ficar em branco.
                </span>
              ) : (
                <span className="text-neutral-500">
                  Comece a digitar para validar o campo.
                </span>
              )}
            </div>
          </div>

          {/* Campo Descrição (OPCIONAL) */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor={descricaoId}
                className="font-black text-xs uppercase tracking-wider text-black flex items-center gap-1.5"
              >
                <span>Descrição da Tarefa</span>
              </label>

              <span className="bg-neutral-200 text-black font-mono font-bold text-[10px] uppercase px-2 py-0.5 border border-black">
                Opcional
              </span>
            </div>

            <textarea
              id={descricaoId}
              rows={4}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              disabled={isSubmitting}
              placeholder="Adicione detalhes, observações ou links úteis sobre esta tarefa..."
              className="w-full px-3.5 py-2.5 font-medium text-sm text-black placeholder:text-neutral-400 border-3 border-black bg-neutral-50 focus:bg-white focus:outline-none border-b-4 border-b-black transition-colors"
            />
            <span className="text-[11px] font-mono text-neutral-500 text-right">
              {descricao.length} caracteres
            </span>
          </div>

          {/* Área de Ações */}
          <div className="mt-2 pt-4 border-t-3 border-black flex flex-col gap-3">
            {/* Mensagem obrigatória enquanto os campos não estiverem preenchidos */}
            {!isFormValid && (
              <div
                role="status"
                aria-live="polite"
                className="p-3 bg-amber-200 border-2 border-black text-black font-mono text-xs font-bold flex items-center gap-2 animate-pulse"
              >
                <span className="bg-black text-amber-300 px-1.5 py-0.5 font-black text-[10px]">
                  AVISO
                </span>
                <span>
                  <strong>Título obrigatório:</strong> preencha o campo de título
                  acima para liberar o botão salvar.
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-neutral-200 text-black font-black uppercase text-xs border-3 border-black shadow-[3px_3px_0px_0px_#000] hover:bg-neutral-300 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000] transition-all cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>

              {/* O botão salvar SÓ APARECE quando todos os campos obrigatórios estiverem preenchidos */}
              {isFormValid && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-lime-400 text-black font-black uppercase text-xs border-3 border-black shadow-[4px_4px_0px_0px_#000] hover:bg-lime-300 active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#000] transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block w-3.5 h-3.5 border-2 border-black border-t-transparent animate-spin rounded-full" />
                      Salvando...
                    </>
                  ) : isEditing ? (
                    "💾 Atualizar Tarefa"
                  ) : (
                    "✓ Salvar Tarefa"
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

