import type {
  AuthCredentials,
  AuthResponse,
  Theme,
  User,
} from "../types/auth";

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    ...options,

    credentials: "same-origin",

    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Ошибка сервера");
  }

  return data as T;
}

// Получение текущего пользователя
export function getCurrentUser() {
  return request<{ user: User | null }>("/auth/me");
}

// Регистрация
export function register(
  credentials: AuthCredentials,
  theme: Theme
) {
  return request<AuthResponse>("/auth/register", {
    method: "POST",

    body: JSON.stringify({
      ...credentials,
      theme,
    }),
  });
}

// Авторизация
export function login(credentials: AuthCredentials) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",

    body: JSON.stringify(credentials),
  });
}

// Выход
export async function logout() {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error("Не удалось выйти из аккаунта");
  }

  return response.json();
}

// Сохранение темы
export function saveTheme(theme: Theme) {
  return request<{ success: boolean; theme: Theme }>(
    "/users/theme",
    {
      method: "PATCH",
      body: JSON.stringify({ theme }),
    }
  );
}