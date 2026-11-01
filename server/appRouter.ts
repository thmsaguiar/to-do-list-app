import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "./trpc";

export type Task = {
  id: string;
  titulo: string;
  descricao?: string; // Descrição opcional
  dataCriacao: string;
};

// Cache em memória
const taskCache = new Map<string, Task>();

// Validação do título
const taskSchema = z.object({
  titulo: z.string().trim().min(1, "O título da tarefa é obrigatório."),
  descricao: z.string().optional(),
});

export const appRouter = router({
  // Listar tarefas
  taskList: publicProcedure.query(() => {
    return Array.from(taskCache.values());
  }),

  // Listar tarefas paginadas
  taskListPaginated: publicProcedure
    .input(
      z.object({
        cursor: z.number().int().min(0).default(0),
        limit: z.number().int().min(1).max(50).default(10),
      }),
    )
    .query(({ input }) => {
      const allTasks = Array.from(taskCache.values());

      const tasks = allTasks.slice(input.cursor, input.cursor + input.limit);

      const nextCursor =
        input.cursor + tasks.length < allTasks.length
          ? input.cursor + tasks.length
          : null;

      return {
        tasks,
        nextCursor,
      };
    }),

  // Buscar tarefa
  taskById: publicProcedure.input(z.string()).query(({ input }) => {
    const task = taskCache.get(input);

    if (!task) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Tarefa não encontrada.",
      });
    }

    return task;
  }),

  // Criar tarefa
  taskCreate: publicProcedure.input(taskSchema).mutation(({ input }) => {
    const task: Task = {
      id: crypto.randomUUID(), // Id único com UUID
      ...input,
      dataCriacao: new Date().toISOString(),
    };

    taskCache.set(task.id, task);

    return task;
  }),

  // Atualizar tarefa
  taskUpdate: publicProcedure
    .input(
      z.object({
        id: z.string(),
        titulo: z
          .string()
          .trim()
          .min(1, "O título não pode ficar vazio.")
          .optional(),
        descricao: z.string().optional(),
      }),
    )
    .mutation(({ input }) => {
      const task = taskCache.get(input.id);

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Não foi possível atualizar: tarefa não encontrada.",
        });
      }

      const updatedTask = {
        ...task,
        ...input,
      };

      taskCache.set(input.id, updatedTask);

      return updatedTask;
    }),

  // Excluir tarefa
  taskDelete: publicProcedure.input(z.string()).mutation(({ input }) => {
    const deleted = taskCache.delete(input);

    if (!deleted) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Não foi possível excluir: tarefa não encontrada.",
      });
    }

    return { success: true };
  }),
});

export type AppRouter = typeof appRouter;
