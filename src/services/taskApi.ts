import type {
  Task,
  CreateTaskData,
  UpdateTaskData,
} from "../types/task";

async function taskRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`/api/tasks${endpoint}`, {
    ...options,
    credentials: "same-origin",
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error || "Не удалось выполнить запрос"
    );
  }

  return data as T;
}

// Получение задач по дате
export function getTasks(day: string) {
  return taskRequest<{ tasks: Task[] }>(
    `?day=${encodeURIComponent(day)}`
  );
}

// Создание задачи
export function createTask(data: CreateTaskData) {
  return taskRequest<{ task: Task }>("", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Редактирование задачи
export async function updateTask(
  id: string,
  updates: UpdateTaskData
) {
  const response = await fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(updates),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Ошибка обновления задачи");
  }

  return data;
}

// Удаление задачи
export function deleteTask(id: string) {
  return taskRequest<{ success: boolean }>(
    `/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );
}