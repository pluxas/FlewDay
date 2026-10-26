import { useEffect, useState } from "react";

import type { Task } from "../../types/task";
import type { PomodoroState } from "../../types/pomodoro";

interface CompletionForecastProps {
  tasks: Task[];
  selectedTask?: Task;
  completedByTask: Record<string, number>;
  focusMinutes: number;
  breakMinutes: number;
  timer: PomodoroState | null;
  remainingSeconds: number;
}

export default function CompletionForecast({
  tasks,
  selectedTask,
  completedByTask,
  focusMinutes,
  breakMinutes,
  timer,
  remainingSeconds,
}: CompletionForecastProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  function getRemaining(task: Task) {
    return Math.max(0, task.target - (completedByTask[task.id] ?? 0));
  }

  // Учитываем только незавершённые задачи
  const pendingTasks = tasks.filter((task) => !task.done);

  const totalPomodoros = pendingTasks.reduce(
    (sum, task) => sum + getRemaining(task),
    0,
  );

  // При работающем таймере используем его задачу
  const activeTask =
    timer?.mode === "focus" && timer.status !== "idle"
      ? (tasks.find((task) => task.id === timer.taskId) ?? selectedTask)
      : selectedTask;

  const taskPomodoros = activeTask ? getRemaining(activeTask) : 0;

  function estimateSeconds(count: number, taskIds: string[]) {
    if (count <= 0) return 0;

    const focusSeconds = focusMinutes * 60;
    const breakSeconds = breakMinutes * 60;

    let total = count * focusSeconds + Math.max(0, count - 1) * breakSeconds;

    // Учитываем уже прошедшее время текущего фокуса
    if (
      timer?.mode === "focus" &&
      timer.status !== "idle" &&
      timer.taskId &&
      taskIds.includes(timer.taskId)
    ) {
      const elapsed = Math.max(0, timer.durationSeconds - remainingSeconds);

      total = Math.max(0, total - elapsed);
    }

    return total;
  }

  const taskSeconds = estimateSeconds(
    taskPomodoros,
    activeTask ? [activeTask.id] : [],
  );

  const totalSeconds = estimateSeconds(
    totalPomodoros,
    pendingTasks.map((task) => task.id),
  );

  function formatDuration(seconds: number) {
    const minutes = Math.ceil(seconds / 60);

    if (minutes < 60) return `~${minutes} мин`;

    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;

    return `~${hours} ч ${rest} мин`;
  }

  function finishTime(seconds: number, count: number, taskIds: string[]) {
    let finishAt = now + seconds * 1000;

    if (
      count > 0 &&
      timer?.mode === "focus" &&
      timer.status === "running" &&
      timer.endAt &&
      timer.taskId &&
      taskIds.includes(timer.taskId)
    ) {
      finishAt =
        Date.parse(timer.endAt) +
        (count - 1) * (focusMinutes + breakMinutes) * 60_000;
    }

    return new Date(finishAt).toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (tasks.length === 0) return null;

  return (
    <div className="mt-5 rounded-xl border border-gray-200 bg-[#f7f8fa] p-4 dark:border-[#383a43] dark:bg-[#292b33]">
      <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-3 dark:border-[#383a43]">
        <span className="text-[11px] font-bold tracking-wide text-gray-400">
          ПРОГНОЗ ЗАВЕРШЕНИЯ
        </span>

        <span className="text-xs font-semibold text-[#ff503b]">
          {totalPomodoros} 🍅 ({formatDuration(totalSeconds)})
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-gray-400">Закончишь эту задачу в:</span>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400">
              {activeTask ? `(${formatDuration(taskSeconds)})` : ""}
            </span>

            <span className="rounded-lg bg-white px-3 py-2 text-sm font-bold dark:bg-[#202127]">
              {activeTask
                ? taskPomodoros > 0
                  ? finishTime(
                      taskSeconds,
                      taskPomodoros,
                      activeTask ? [activeTask.id] : [],
                    )
                  : "Готово"
                : "—"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-gray-400">Все задачи на день в:</span>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400">
              ({formatDuration(totalSeconds)})
            </span>

            <span className="rounded-lg border border-[#ff503b]/20 bg-[#fff0ed] px-3 py-2 text-sm font-bold text-[#ff503b] dark:bg-[#ff503b]/10">
              {totalPomodoros > 0
                ? finishTime(
                    totalSeconds,
                    totalPomodoros,
                    pendingTasks.map((task) => task.id),
                  )
                : "Готово"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
