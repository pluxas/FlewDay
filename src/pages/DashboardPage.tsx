import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

// COMPONENTS
import WeekCalendar from "../components/dashboard/WeekCalendar";
import TaskList from "../components/dashboard/TaskList";
import PomodoroTimer from "../components/dashboard/PomodoroTimer";
import SettingsModal from "../components/settings/SettingsModal";
import AutoHideTop from "../components/layout/AutoHideTop";

// HOOKS
import { useTasks } from "../hooks/useTasks";
import { usePomodoro } from "../hooks/usePomodoro";

// SERVICES
import { saveSettings, type PomodoroSettings } from "../services/settingsApi";

// TYPES
import type { User } from "../types/auth";

// ------------------------------------
// TYPES
// ------------------------------------

interface DashboardPageProps {
  user: User;
}

// ------------------------------------
// HELPERS
// ------------------------------------

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// ------------------------------------
// DASHBOARD PAGE
// ------------------------------------

export default function DashboardPage({ user }: DashboardPageProps) {
  // ------------------------------------
  // STATES
  // ------------------------------------

  const [selectedDate, setSelectedDate] = useState(new Date());

  const [searchParams, setSearchParams] = useSearchParams();

  const settingsOpen = searchParams.get("settings") === "open";

  function closeSettings() {
    const next = new URLSearchParams(searchParams);

    next.delete("settings");

    setSearchParams(next, { replace: true });
  }

  const [settings, setSettings] = useState<PomodoroSettings>({
    focusMinutes: user.focusMinutes ?? 25,
    breakMinutes: user.breakMinutes ?? 5,
  });

  // ------------------------------------
  // SELECTED DAY
  // ------------------------------------

  const day = formatLocalDate(selectedDate);

  // ------------------------------------
  // TASKS
  // ------------------------------------

  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    addTask,
    editTask,
    removeTask,
  } = useTasks(day);

  // ------------------------------------
  // POMODORO
  // ------------------------------------

  const {
    timer,
    stats,
    remainingSeconds,

    loading: pomodoroLoading,
    busy: pomodoroBusy,
    error: pomodoroError,

    start,
    pause,
    reset,
    changeMode,
    refresh,
    selectTask,
  } = usePomodoro();

  // ------------------------------------
  // SELECTED TASK
  // ------------------------------------

  // Единственный источник выбранной задачи:
  // timer.taskId, который приходит с Backend.

  const selectedTaskId = timer?.taskId ?? null;

  // Находим выбранную задачу
  // среди задач открытого дня.

  const activeTask = tasks.find(
    (task) => task.id === selectedTaskId && !task.done,
  );

  // ------------------------------------
  // SELECT TASK
  // ------------------------------------

  async function handleSelectTask(id: string) {
    // Не допускаем переключение,
    // пока выполняется запрос.

    if (pomodoroBusy || pomodoroLoading) {
      return;
    }

    // Если задача уже выбрана,
    // повторно ничего не делаем.

    if (selectedTaskId === id) {
      return;
    }

    const isRunning = timer?.status === "running";

    // ------------------------------------
    // RUNNING TIMER
    // ------------------------------------

    if (isRunning) {
      const confirmed = window.confirm(
        "Сейчас работает таймер Помодоро.\n\n" +
          "Если изменить задачу, текущая сессия " +
          "будет сброшена.\n\n" +
          "Таймер новой задачи автоматически " +
          "начнётся заново.\n\n" +
          "Ты действительно хочешь изменить задачу?",
      );

      if (!confirmed) {
        return;
      }
    }

    // ------------------------------------
    // SEND TO BACKEND
    // ------------------------------------

    // Если таймер работает:
    // restart = true.
    //
    // Если на паузе или не запущен:
    // restart = false.

    await selectTask(id, isRunning);
  }

  async function handleAddTask(title: string, target: number) {
    // Проверяем количество задач ДО создания новой
    const isFirstTask = tasks.length === 0;

    // Создаём задачу
    const newTask = await addTask(title, target);

    // Автоматически выбираем только первую
    if (isFirstTask) {
      await handleSelectTask(newTask.id);
    }
  }

  // ------------------------------------
  // DELETE TASK
  // ------------------------------------

  // async function handleDeleteTask(id: string) {
  //   await removeTask(id);

  //   // Обновляем состояние таймера,
  //   // поскольку удалённая задача могла
  //   // быть выбрана.

  //   if (selectedTaskId === id) {
  //     await refresh();
  //   }
  // }

  // ------------------------------------
  // SAVE SETTINGS
  // ------------------------------------

  async function handleSaveSettings(
    newSettings: PomodoroSettings,
    resetTimer: boolean,
  ) {
    const savedSettings = await saveSettings(newSettings, resetTimer);

    setSettings(savedSettings);

    await refresh();
  }

  // ------------------------------------
  // RENDER
  // ------------------------------------

  // ------------------------------------
  // SPACE — START / PAUSE POMODORO
  // ------------------------------------

  useEffect(() => {
    function handleSpaceKey(event: KeyboardEvent) {
      // Реагируем только на пробел
      if (event.code !== "Space") return;

      // Игнорируем удержание клавиши и комбинации
      if (
        event.repeat ||
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        event.shiftKey
      ) {
        return;
      }

      // Проверяем, где сейчас находится курсор
      const target = event.target;

      if (target instanceof HTMLElement) {
        // Если пользователь работает с полями,
        // кнопками или редактируемым текстом,
        // не вмешиваемся.
        if (
          target.isContentEditable ||
          target.closest(
            'input, textarea, select, button, a, [contenteditable], [role="textbox"]',
          )
        ) {
          return;
        }
      }

      // Не запускаем таймер, если открыто
      // модальное окно настроек
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) {
        return;
      }

      // Если таймер уже работает — ставим на паузу
      if (timer?.status === "running") {
        event.preventDefault();

        void pause();
        return;
      }

      // В режиме фокуса нужна выбранная задача
      if (timer?.mode !== "break" && !activeTask) {
        return;
      }

      // Запускаем или продолжаем таймер
      event.preventDefault();

      void start(activeTask?.id);
    }

    window.addEventListener("keydown", handleSpaceKey);

    return () => {
      window.removeEventListener("keydown", handleSpaceKey);
    };
  }, [timer?.status, timer?.mode, activeTask?.id, start, pause]);

  // ------------------------------------
  // DELETE TASK
  // ------------------------------------

  async function handleDeleteTask(taskId: string) {
    // Проверяем, удаляем ли активную задачу
    const isActiveTask = timer?.taskId === taskId;

    // Сортируем задачи по времени создания
    const sortedTasks = [...tasks].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    // Находим позицию удаляемой задачи
    const currentIndex = sortedTasks.findIndex((task) => task.id === taskId);

    // Определяем следующую задачу
    let nextTask = null;

    if (isActiveTask && currentIndex !== -1) {
      nextTask =
        sortedTasks[currentIndex + 1] ?? sortedTasks[currentIndex - 1] ?? null;
    }

    // Удаляем задачу.
    // Backend автоматически остановит таймер,
    // если удаляется активная задача.
    await removeTask(taskId);

    // Если удалена активная задача,
    // выбираем следующую без запуска таймера.
    if (isActiveTask) {
      try {
        if (nextTask) {
          await selectTask(nextTask.id, false);
        }
      } finally {
        // Синхронизируем состояние с Backend
        await refresh();
      }
    }
  }

  return (
    <main
      className="
        mx-auto
        w-full
        max-w-[1140px]
        pl-5
        pr-5
        pb-10
        md:pr-20
      "
    >
      <AutoHideTop>
        <WeekCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      </AutoHideTop>

      {/* -------------------------------- */}
      {/* DASHBOARD                        */}
      {/* -------------------------------- */}

      <div
        className="
          mt-5
          grid
          items-start
          gap-5
          md:grid-cols-[1.15fr_0.85fr]
        "
      >
        {/* ------------------------------ */}
        {/* TASK LIST                      */}
        {/* ------------------------------ */}

        <TaskList
          selectedDate={selectedDate}
          tasks={tasks}
          completedByTask={stats.byTask}
          loading={tasksLoading}
          error={tasksError}

          // Выбранная задача приходит с Backend.
          selectedTaskId={selectedTaskId}

          // Выбор задачи.
          onSelectTask={(id) => {
            void handleSelectTask(id);
          }}

          // CRUD.
          onCreateTask={handleAddTask}
          onUpdateTask={editTask}
          onDeleteTask={handleDeleteTask}
        />

        {/* ------------------------------ */}
        {/* POMODORO TIMER                 */}
        {/* ------------------------------ */}

        <PomodoroTimer
          // TASKS
          selectedTask={activeTask}
          tasks={tasks}

          // SETTINGS
          focusMinutes={settings.focusMinutes}
          breakMinutes={settings.breakMinutes}

          // TIMER
          timer={timer}
          stats={stats}
          remainingSeconds={remainingSeconds}

          // STATUS
          loading={pomodoroLoading}
          busy={pomodoroBusy}
          error={pomodoroError}

          // ACTIONS
          onStart={start}
          onPause={pause}
          onReset={reset}
          onChangeMode={changeMode}
        />
      </div>

      {/* -------------------------------- */}
      {/* FOOTER                           */}
      {/* -------------------------------- */}

      <p className="mt-6 text-center text-xs text-gray-400">
        Аккаунт: {user.email}
      </p>

      {/* -------------------------------- */}
      {/* SETTINGS MODAL                   */}
      {/* -------------------------------- */}

      {settingsOpen && (
        <SettingsModal
          settings={settings}
          timerStatus={timer?.status ?? "idle"}
          onClose={closeSettings}
          onSave={handleSaveSettings}
        />
      )}
    </main>
  );
}
