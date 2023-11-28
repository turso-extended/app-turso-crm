// @ts-ignore
import Database from "libsql";
import { tenantDbLocalPath } from "./utils";

interface Env {
  url: string;
  TURSO_DB_AUTH_TOKEN?: string;
}

export function buildOrgDbClient({ url }: Env) {
  if (url === undefined || url == null) {
    throw new Error("db url is not defined");
  }

  const authToken = (process.env as unknown as Env).TURSO_DB_AUTH_TOKEN?.trim();
  if (authToken === undefined) {
    throw new Error("TURSO_DB_AUTH_TOKEN is not defined");
  }

  return new Database(tenantDbLocalPath(url), {
    syncUrl: `libsql://${url}`,
    authToken,
  });
}
