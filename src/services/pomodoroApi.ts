import type {
  PomodoroMode,
  PomodoroSnapshot,
} from "../types/pomodoro";

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(
    `/api/pomodoro${endpoint}`,
    {
      ...options,

      credentials: "same-origin",

      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error || "Ошибка подключения к серверу"
    );
  }

  return data as T;
}

// Получение локальных границ сегодняшнего дня.
// На сервер отправляем UTC, чтобы статистика
// правильно учитывала часовой пояс пользователя.

function getTodayRange() {
  const now = new Date();

  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    from: start.toISOString(),
    to: end.toISOString(),
  };
}

// Получаем состояние таймера и статистику

export function getPomodoroState() {
  const { from, to } = getTodayRange();

  const params = new URLSearchParams({
    from,
    to,
  });

  return request<PomodoroSnapshot>(
    `/state?${params.toString()}`
  );
}

// Запуск или продолжение таймера

export function startPomodoro(taskId?: string) {
  return request<{ success: boolean }>("/start", {
    method: "POST",

    body: JSON.stringify({
      ...(taskId ? { taskId } : {}),
    }),
  });
}

// Пауза

export function pausePomodoro() {
  return request<{ success: boolean }>("/pause", {
    method: "POST",
  });
}

// Сброс

export function resetPomodoro() {
  return request<{ success: boolean }>("/reset", {
    method: "POST",
  });
}

// Переключение режима

export function changePomodoroMode(
  mode: PomodoroMode
) {
  return request<{ success: boolean }>("/mode", {
    method: "POST",

    body: JSON.stringify({
      mode,
    }),
  });
}

export async function addManualPomodoro(
  taskId: string,
): Promise<void> {
  const response = await fetch("/api/pomodoro/manual", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ taskId }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));

    throw new Error(
      typeof data.error === "string"
        ? data.error
        : "Не удалось добавить Помодоро",
    );
  }
}

export async function selectPomodoroTask(
  taskId: string,
  restart = false,
): Promise<void> {
  const response = await fetch("/api/pomodoro/select", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      taskId,
      restart,
    }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);

    throw new Error(
      data?.error ?? "Не удалось выбрать задачу",
    );
  }
}

