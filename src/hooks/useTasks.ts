import { useEffect, useRef, useState } from "react";

import * as taskApi from "../services/taskApi";

import type {
  Task,
  UpdateTaskData,
} from "../types/task";

export function useTasks(day: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Защита от обновления списка для уже выбранного другого дня
  const currentDayRef = useRef(day);
  currentDayRef.current = day;

  // Загрузка задач
  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError("");
    setTasks([]);

    taskApi
      .getTasks(day)
      .then((data) => {
        if (!cancelled) {
          setTasks(data.tasks);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Ошибка загрузки задач"
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [day]);

  // Создание задачи
  async function addTask(title: string, target: number) {
    const taskDay = day;

    const { task } = await taskApi.createTask({
      title,
      target,
      day: taskDay,
    });

    if (currentDayRef.current === taskDay) {
      setTasks((previous) => [task, ...previous]);
    }

    return task;
  }

  // Обновление задачи
  async function editTask(
    id: string,
    updates: UpdateTaskData
  ) {
    const taskDay = day;

    const { task } = await taskApi.updateTask(id, updates);

    if (currentDayRef.current === taskDay) {
      setTasks((previous) =>
        previous.map((item) =>
          item.id === id ? task : item
        )
      );
    }
  }

  // Удаление задачи
  async function removeTask(id: string) {
    const taskDay = day;

    await taskApi.deleteTask(id);

    if (currentDayRef.current === taskDay) {
      setTasks((previous) =>
        previous.filter((task) => task.id !== id)
      );
    }
  }

  return {
    tasks,
    loading,
    error,
    addTask,
    editTask,
    removeTask,
  };
}