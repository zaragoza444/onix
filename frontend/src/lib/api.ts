const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type User = {
  id: number;
  email: string;
  display_name: string;
  created_at: string;
};

export type AuthResponse = {
  access_token: string;
  token_type: string;
  user: User;
};

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("onix_token");
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("onix_token", token);
  else localStorage.removeItem("onix_token");
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("onix_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null) {
  if (typeof window === "undefined") return;
  if (user) localStorage.setItem("onix_user", JSON.stringify(user));
  else localStorage.removeItem("onix_user");
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (options.auth !== false) {
    const token = getStoredToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail =
      typeof data.detail === "string"
        ? data.detail
        : "Request failed";
    throw new Error(detail);
  }
  return data as T;
}

export async function register(
  email: string,
  password: string,
  displayName?: string
) {
  return apiFetch<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    auth: false,
    body: JSON.stringify({
      email,
      password,
      display_name: displayName ?? "",
    }),
  });
}

export async function login(email: string, password: string) {
  return apiFetch<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchMe() {
  return apiFetch<User>("/api/v1/auth/me");
}

export type ReceiverConfig = {
  receiver_key: string;
  hook_url: string;
  ingest_url: string;
  environment: string;
  webhook_secret_header: string;
};

export type ApiTransfer = {
  id: number;
  direction: string;
  status: string;
  method: string;
  url: string;
  request_body: string;
  response_status: number | null;
  response_body: string | null;
  error_message: string | null;
  environment: string;
  created_at: string;
};

export type TransferList = {
  items: ApiTransfer[];
  total: number;
};

export function fetchReceiverConfig() {
  return apiFetch<ReceiverConfig>("/api/v1/receiver/config");
}

export function ingestPayload(payload: unknown, eventType = "message") {
  return apiFetch<ApiTransfer>("/api/v1/receiver/ingest", {
    method: "POST",
    body: JSON.stringify({ payload, event_type: eventType, metadata: {} }),
  });
}

export function listReceivedMessages(limit = 20) {
  return apiFetch<TransferList>(`/api/v1/receiver/messages?limit=${limit}`);
}

export function dispatchOutbound(
  url: string,
  method: string,
  body: string,
  headersJson: string
) {
  let parsedBody: unknown = null;
  if (body.trim()) {
    try {
      parsedBody = JSON.parse(body);
    } catch {
      parsedBody = body;
    }
  }
  let headers: Record<string, string> = {};
  if (headersJson.trim()) {
    headers = JSON.parse(headersJson) as Record<string, string>;
  }
  return apiFetch<ApiTransfer>("/api/v1/sender/dispatch", {
    method: "POST",
    body: JSON.stringify({ url, method, headers, body: parsedBody }),
  });
}

export function listSentMessages(limit = 20) {
  return apiFetch<TransferList>(`/api/v1/sender/messages?limit=${limit}`);
}
