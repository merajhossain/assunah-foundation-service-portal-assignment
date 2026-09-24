import { api } from "@/lib/api/client";

export type LoginResult = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

export type LoginPayload = {
  email: string;
  password: string;
};

export function loginRequest(
  payload: LoginPayload,
  options?: { signal?: AbortSignal },
) {
  return api.post<LoginResult>("/api/auth/login", payload, {
    signal: options?.signal,
  });
}
