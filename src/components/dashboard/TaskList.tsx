import { useState, type FormEvent, useRef } from "react";
import { Minus, Plus } from "lucide-react";

import TaskCard from "./TaskCard";

import type { Task, UpdateTaskData } from "../../types/task";

interface TaskListProps {
  selectedDate: Date;
  tasks: Task[];
  loading: boolean;
  error: string;
  completedByTask: Record<string, number>;

  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;

  onCreateTask: (title: string, target: number) => Promise<void>;

  onUpdateTask: (id: string, data: UpdateTaskData) => Promise<void>;

  onDeleteTask: (id: string) => Promise<void>;
}

export default function TaskList({
  selectedDate,
  tasks,
  loading,
  error,
  completedByTask,
  selectedTaskId,
  onSelectTask,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
}: TaskListProps) {
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("1");

  const targetInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const [submitting] = useState(false);
  const [formError] = useState("");

  const formattedDate = selectedDate.toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const taskTitle = title.trim();

    if (!taskTitle) return;

    const pomodoroCount = Math.max(1, Math.min(20, Number(target) || 1));

    try {
      await onCreateTask(taskTitle, pomodoroCount);

      setTitle("");

      setTarget("1");

      targetInputRef.current?.blur();
      titleInputRef.current?.blur();
    } catch (error) {
      console.error("Ошибка создания задачи:", error);
    }
  }

  // Сортируем задачи от старых к новым
  const sortedTasks = [...tasks].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() -
      new Date(b.createdAt).getTime()
  );
  
  return (
    <section className="rounded-[22px] border border-gray-200 bg-white p-5 shadow-sm dark:border-[#333640] dark:bg-[#202127]">
      {/* HEADER */}

      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">
            Задачи
            <span className="ml-2 text-xs font-normal text-gray-400">
              • {formattedDate}
            </span>
          </h2>

          <p className="mt-1 text-[11px] text-gray-400">
            Нажми на задачу, чтобы выбрать её для Помодоро
          </p>
        </div>

        <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs dark:bg-[#292b33]">
          {tasks.length} задач
        </span>
      </div>

      {/* CREATE TASK */}

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-2xl bg-[#f3f4f6] p-2 dark:bg-[#292b33] bg-[#f1f3f6] dark:bg-[#292b33]"
      >
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Добавить новую задачу..."
          maxLength={140}
          required
          disabled={submitting || loading}
          className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-gray-400 text-[#111827] placeholder:text-[#8490a3] dark:text-white dark:placeholder:text-[#9ca3af]"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();

              targetInputRef.current?.focus();
              targetInputRef.current?.select();
            }
          }}
        />

        {/* POMODORO TARGET */}

        <div className="flex shrink-0 items-center gap-2 rounded-xl bg-white px-2 py-2 dark:bg-[#202127]">
          <span className="text-xs">🍅</span>

          <button
            type="button"
            onClick={() =>
              setTarget((value) => String(Math.max(1, Number(value) - 1)))
            }
            disabled={Number(target) <= 1}
            aria-label="Уменьшить цель"
            className="text-gray-400 disabled:opacity-30"
          >
            <Minus size={12} />
          </button>

          <input
            ref={targetInputRef}
            type="text"
            inputMode="numeric"
            value={target}
            aria-label="Количество Помодоро"
            onChange={(event) => {
              const value = event.target.value;

              if (/^\d{0,2}$/.test(value)) {
                setTarget(value);
              }
            }}
            onFocus={(event) => event.currentTarget.select()}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            className="w-8 min-w-0 bg-transparent text-center text-sm font-bold tabular-nums text-[#111827] outline-none dark:text-white"
          />

          <button
            type="button"
            onClick={() =>
              setTarget((value) => String(Math.min(20, Number(value) + 1)))
            }
            disabled={Number(target) >= 20}
            aria-label="Увеличить цель"
            className="text-gray-400 disabled:opacity-30"
          >
            <Plus size={12} />
          </button>
        </div>

        {/* ADD BUTTON */}

        <button
          type="submit"
          disabled={submitting || loading || !title.trim()}
          aria-label="Добавить задачу"
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-[#ff503b]
            text-white
            transition
            hover:bg-[#e84633]
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          <Plus size={18} />
        </button>
      </form>

      {formError && (
        <p role="alert" className="mt-3 text-xs text-red-500">
          {formError}
        </p>
      )}

      {/* TASKS */}

      <div
        className={`
          mt-5 space-y-2.5
          ${
            tasks.length > 3
              ? "max-h-[440px] overflow-y-auto overscroll-contain pr-2"
              : ""
          }
        `}
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "#555761 transparent",
        }}
      >
        {loading ? (
          <p className="py-10 text-center text-sm text-gray-400">
            Загрузка задач...
          </p>
        ) : error ? (
          <p className="py-10 text-center text-sm text-red-400">{error}</p>
        ) : tasks.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">
            Задач пока нет. Добавь первую!
          </p>
        ) : (
          sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              completed={completedByTask[task.id] ?? 0}
              selected={selectedTaskId === task.id}
              onSelect={() => onSelectTask(task.id)}
              onUpdate={(id, updates) => onUpdateTask(id, updates)}
              onDelete={() => onDeleteTask(task.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}
