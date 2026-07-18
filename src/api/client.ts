import { getStoredToken } from "@/contexts/AuthContext";

type Primitive = string | number | boolean | null | undefined;

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  params?: Record<string, Primitive>;
  body?: unknown;
  headers?: HeadersInit;
  auth?: boolean;
}

export class ApiError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(body || `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

const appBasePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const externalApiBase = (import.meta.env.VITE_API_BASE_URL ?? "").replace(
  /\/$/,
  "",
);

function buildUrl(path: string, params?: RequestOptions["params"]): string {
  const isAbsolutePath = /^https?:\/\//.test(path);
  const prefixedPath = isAbsolutePath ? path : `${externalApiBase || appBasePath}${path}`;
  const url = new URL(prefixedPath, window.location.origin);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

export async function apiRequest<T>(
  path: string,
  { method = "GET", params, body, headers, auth }: RequestOptions = {},
): Promise<T> {
  const authHeaders: Record<string, string> = {};
  if (auth) {
    const token = getStoredToken();
    if (token) {
      authHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(buildUrl(path, params), {
    method,
    credentials: "same-origin",
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...authHeaders,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new ApiError(response.status, text);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function buildApiUrl(path: string): string {
  return buildUrl(path);
}

export function buildAuthenticatedApiUrl(path: string): string {
  const url = buildUrl(path);
  const token = getStoredToken();
  if (token) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}token=${encodeURIComponent(token)}`;
  }
  return url;
}
