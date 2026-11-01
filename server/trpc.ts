
import { initTRPC, TRPCError } from "@trpc/server";

const t = initTRPC.create();

// Middleware de tratamento de erros
const errorMiddleware = t.middleware(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }

    console.error("Erro inesperado:", error);

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Ocorreu um erro interno ao processar a operação.",
    });
  }
});

export const router = t.router;

export const publicProcedure = t.procedure.use(errorMiddleware);
