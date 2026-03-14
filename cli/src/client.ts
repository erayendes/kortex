import { getApiUrl, getPersona } from "./config.js";

type Method = "GET" | "POST" | "PATCH" | "DELETE";

export async function api<T = any>(
  path: string,
  method: Method = "GET",
  body?: Record<string, unknown>
): Promise<T> {
  const url = `${getApiUrl()}/api/v1${path}`;
  const headers: Record<string, string> = {
    "X-Persona-Id": getPersona(),
  };

  const init: RequestInit = { method, headers };

  if (body) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const res = await fetch(url, init);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  const json = await res.json();
  // API returns { data: ... } wrapper — unwrap for CLI convenience
  if (json && typeof json === "object" && "data" in json && !("id" in json)) {
    return json.data;
  }
  return json;
}
