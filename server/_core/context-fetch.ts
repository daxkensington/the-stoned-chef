import { COOKIE_NAME } from "@shared/const";
import { verifyJWT } from "./auth";
import type { Admin } from "../../drizzle/schema";
import { getAdminByUsername } from "../db";

export type FetchContext = {
  admin: Admin | null;
  resHeaders: Headers;
};

function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...rest] = c.trim().split("=");
      return [key, rest.join("=")];
    })
  );
}

export async function createFetchContext({
  req,
  resHeaders,
}: {
  req: Request;
  resHeaders: Headers;
}): Promise<FetchContext> {
  let admin: Admin | null = null;

  try {
    const cookies = parseCookies(req.headers.get("cookie"));
    const token = cookies[COOKIE_NAME];
    if (token) {
      const payload = await verifyJWT(token);
      if (payload?.username) {
        admin = await getAdminByUsername(payload.username);
      }
    }
  } catch {
    admin = null;
  }

  return { admin, resHeaders };
}
