import { routeTable, simpleDispatch } from "./routes.mjs";
import { service } from "./service.mjs";
import { guarded, errorResponse, readJson } from "./transport.mjs";
import { fail } from "./errors.mjs";
import { initTRPC, TRPCError } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { schema } from "./validator.mjs";
const t = initTRPC.create({
  isDev: false,
  errorFormatter({ shape }) {
    return {
      ...shape,
      message:
        shape.data.code === "INTERNAL_SERVER_ERROR"
          ? "Não foi possível gerar o terreno."
          : shape.message,
      data: {
        code: shape.data.code,
        httpStatus: shape.data.httpStatus,
        path: shape.data.path,
      },
    };
  },
});
export const appRouter = t.router({
  generate: t.procedure
    .input(schema)
    .mutation(({ input }) => service.compute(input)),
});
export function createApi(db, clock) {
  const dispatch = simpleDispatch(routeTable(db, service, clock));
  return guarded(async (req) => {
    if (!new URL(req.url).pathname.startsWith("/api/trpc/"))
      return dispatch(req);
    if (req.method !== "POST") fail("method_not_allowed", "Use POST.", 405);
    await readJson(req.clone());
    return fetchRequestHandler({
      endpoint: "/api/trpc",
      req,
      router: appRouter,
      createContext: () => ({}),
    });
  });
}
