import { Pause, Play, RotateCcw } from "lucide-react";

import type { Task } from "../../types/task";

import type {
  PomodoroMode,
  PomodoroState,
  PomodoroStats,
} from "../../types/pomodoro";

import CompletionForecast from "./CompletionForecast";

// ------------------------------------
// TYPES
// ------------------------------------

interface PomodoroTimerProps {
  selectedTask?: Task;

  tasks: Task[];

  focusMinutes: number;
  breakMinutes: number;

  timer: PomodoroState | null;
  stats: PomodoroStats;

  remainingSeconds: number;

  loading: boolean;
  busy: boolean;
  error: string;

  onStart: (taskId?: string) => Promise<void>;
  onPause: () => Promise<void>;
  onReset: () => Promise<void>;

  onChangeMode: (mode: PomodoroMode) => Promise<void>;

  // Необязательный обработчик ручного завершения.
  // Подключим его к Backend отдельно.
  onAddPomodoro?: (taskId: string) => Promise<void>;
}

// ------------------------------------
// HELPERS
// ------------------------------------

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));

  const minutes = Math.floor(safeSeconds / 60);
  const remaining = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(
    2,
    "0",
  )}`;
}

function getTaskCreatedTime(task?: Task) {
  if (!task) return "";

  const withDates = task as Task & {
    createdAt?: string | number;
    created_at?: string | number;
  };

  const createdAt = withDates.createdAt ?? withDates.created_at;

  if (!createdAt) return "";

  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ------------------------------------
// COMPONENT
// ------------------------------------

export default function PomodoroTimer({
  selectedTask,
  tasks,
  focusMinutes,
  breakMinutes,
  timer,
  stats,
  remainingSeconds,
  loading,
  busy,
  error,
  onStart,
  onPause,
  onReset,
  onChangeMode,
}: PomodoroTimerProps) {

  // ------------------------------------
  // TIMER STATE
  // ------------------------------------

  const isRunning = timer?.status === "running";
  const isPaused = timer?.status === "paused";

  const isFocus = timer?.mode !== "break";

  const isActive = isRunning || isPaused;

  // ------------------------------------
  // ACTIVE TASK
  // ------------------------------------

  const timerTask = tasks.find((task) => task.id === timer?.taskId);

  const activeTask = isActive
    ? (timerTask ?? selectedTask)
    : (selectedTask ?? timerTask);

  const activeTaskId = activeTask?.id ?? timer?.taskId;

  const taskTitle = isActive
    ? (timer?.taskTitle ?? activeTask?.title)
    : (activeTask?.title ?? timer?.taskTitle);

  const completedForTask = activeTaskId ? (stats.byTask[activeTaskId] ?? 0) : 0;

  const taskTarget = activeTask?.target ?? 0;

  const currentSession =
    taskTarget > 0 ? Math.min(completedForTask + 1, taskTarget) : 0;

  const createdTime = getTaskCreatedTime(activeTask);

  // ------------------------------------
  // TIMER PROGRESS
  // ------------------------------------

  const duration =
    timer?.durationSeconds ?? (isFocus ? focusMinutes : breakMinutes) * 60;

  // Кольцо заполнено полностью в начале таймера.
  // По мере отсчёта оставшаяся часть уменьшается.

  const remainingProgress = !timer
    ? 100
    : duration > 0
      ? Math.max(0, Math.min(100, (remainingSeconds / duration) * 100))
      : 100;

  const statusText = isRunning
    ? "Идёт отсчёт"
    : isPaused
      ? "На паузе"
      : "Готов к старту";

  // ------------------------------------
  // BUTTONS
  // ------------------------------------

  const canStart =
    !loading &&
    !busy &&
    Boolean(timer) &&
    (!isFocus || isPaused || Boolean(activeTaskId));

  async function handlePrimaryButton() {
    if (isRunning) {
      await onPause();
      return;
    }

    await onStart(activeTaskId ?? undefined);
  }

  // ------------------------------------
  // RENDER
  // ------------------------------------
  
  return (
    <section
      className="
        rounded-[24px]
        border border-gray-200
        bg-white
        p-5
        shadow-sm
        dark:border-[#333640]
        dark:bg-[#202127]
      "
    >
      {/* ACTIVE TASK HEADER */}

      <div className="mb-4 text-center">
        {/* STATUS BADGE */}

        <div className="mb-3 flex justify-center">
          <span
            className="
              inline-flex items-center gap-1.5
              rounded-full
              bg-[#fff0ed]
              px-3 py-1.5
              text-[10px]
              font-bold
              tracking-[0.04em]
              text-[#ff503b]
              dark:bg-[#ff503b]/10
            "
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff503b]" />

            {isPaused
              ? "НА ПАУЗЕ"
              : !isFocus
                ? "ВРЕМЯ ОТДЫХА"
                : activeTaskId
                  ? "АКТИВНАЯ ЗАДАЧА"
                  : "ВЫБЕРИ ЗАДАЧУ"}
          </span>
        </div>

        {/* TASK TITLE */}

        <h2
          title={taskTitle ?? ""}
          className="
            mx-auto
            max-w-full
            truncate
            text-[19px]
            font-bold
            leading-7
            text-[#17181e]
            dark:text-white
          "
        >
          {taskTitle || "Выбери задачу слева"}
        </h2>

        {/* TASK DETAILS */}

        <div className="mt-1 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] text-[#9699a7]">
          {activeTask ? (
            <>
              <span>
                Сессия {currentSession} из {taskTarget} ({focusMinutes} мин)
              </span>

              {createdTime && (
                <>
                  <span>•</span>
                  <span>Добавлено в {createdTime}</span>
                </>
              )}
            </>
          ) : (
            <span>Выбери задачу, чтобы начать работу</span>
          )}
        </div>
      </div>

      {/* MODE SWITCH */}

      <div
        className="
          mb-7
          grid grid-cols-2
          gap-1
          rounded-xl
          border border-gray-200
          bg-[#f3f4f6]
          p-1
          dark:border-[#383a43]
          dark:bg-[#292b33]
        "
      >
        <button
          type="button"
          disabled={loading || busy || isRunning}
          onClick={() => onChangeMode("focus")}
          className={`
            rounded-lg
            px-2 py-2
            text-xs
            font-semibold
            transition
            disabled:cursor-not-allowed
            ${
              isFocus
                ? "bg-white text-[#17181e] shadow-sm dark:bg-[#202127] dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            }
          `}
        >
          Фокус {focusMinutes}м
        </button>

        <button
          type="button"
          disabled={loading || busy || isRunning}
          onClick={() => onChangeMode("break")}
          className={`
            rounded-lg
            px-2 py-2
            text-xs
            font-semibold
            transition
            disabled:cursor-not-allowed
            ${
              !isFocus
                ? "bg-white text-[#17181e] shadow-sm dark:bg-[#202127] dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            }
          `}
        >
          Отдых {breakMinutes}м
        </button>
      </div>

      {/* CIRCULAR TIMER */}

      <div className="flex justify-center py-2">
        <div
          className="
            flex
            h-[190px]
            w-[190px]
            items-center
            justify-center
            rounded-full
            p-[7px]
            transition-[background]
          "
          style={{
            background: `conic-gradient(
              #ff503b ${remainingProgress}%,
              #e5e7eb ${remainingProgress}% 100%
            )`,
          }}
        >
          {/* INNER CIRCLE */}

          <div
            className="
              flex
              h-full
              w-full
              flex-col
              items-center
              justify-center
              rounded-full
              bg-white
              dark:bg-[#202127]
            "
          >
            {/* TIME */}

            <span
              className="
                text-[49px]
                font-extrabold
                leading-none
                tracking-[-2px]
                tabular-nums
                text-[#17181e]
                dark:text-white
              "
            >
              {formatTime(remainingSeconds)}
            </span>

            {/* STATUS */}

            <span
              className="
                mt-2
                text-[11px]
                font-medium
                text-[#9699a7]
              "
            >
              {statusText}
            </span>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}

      <div className="mt-7 flex items-center gap-2">
        {/* START / PAUSE */}

        <button
          type="button"
          onClick={handlePrimaryButton}
          disabled={loading || busy || (!isRunning && !canStart)}
          className="
            flex
            h-11
            min-w-0
            flex-1
            items-center
            justify-center
            gap-2
            rounded-[14px]
            bg-[#ff503b]
            px-3
            text-sm
            font-semibold
            text-white
            transition
            hover:bg-[#e84633]
            active:scale-[0.98]
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {isRunning ? (
            <>
              <Pause size={16} fill="currentColor" />
              Пауза
            </>
          ) : (
            <>
              <Play size={16} fill="currentColor" />

              {isPaused ? "Продолжить" : "Старт"}
            </>
          )}
        </button>

        {/* RESET TIMER */}

        <button
          type="button"
          onClick={onReset}
          disabled={loading || busy || !timer}
          title="Сбросить таймер"
          aria-label="Сбросить таймер"
          className="
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-[14px]
            bg-[#f3f4f6]
            text-gray-500
            transition
            hover:bg-[#e9eaee]
            disabled:cursor-not-allowed
            disabled:opacity-50
            dark:bg-[#292b33]
            dark:text-gray-400
            dark:hover:bg-[#383a43]
          "
        >
          <RotateCcw size={17} />
        </button>
      </div>

      {/* ERRORS */}

      {(error) && (
        <p
          role="alert"
          className="
            mt-4
            rounded-lg
            bg-red-50
            p-3
            text-xs
            text-red-500
            dark:bg-red-950/20
          "
        >
          {error}
        </p>
      )}

      {/* COMPLETION FORECAST */}

      <CompletionForecast
        tasks={tasks}
        selectedTask={activeTask}
        completedByTask={stats.byTask}
        focusMinutes={focusMinutes}
        breakMinutes={breakMinutes}
        timer={timer}
        remainingSeconds={remainingSeconds}
      />
    </section>
  );
}
