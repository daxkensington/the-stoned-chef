import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../../../server/routers";
import { createFetchContext } from "../../../../server/_core/context-fetch";

const handler = (req: Request) => {
  const resHeaders = new Headers();

  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createFetchContext({ req, resHeaders }),
    onError({ error, path }) {
      console.error(`[tRPC Error] ${path}:`, error.message);
    },
  }).then((response) => {
    resHeaders.forEach((value, key) => {
      response.headers.append(key, value);
    });
    return response;
  });
};

export { handler as GET, handler as POST };
