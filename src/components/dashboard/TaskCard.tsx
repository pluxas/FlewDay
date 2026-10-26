import { useState, type FormEvent } from "react";

import { Pencil, Check, X, Save, Trash2 } from "lucide-react";

import type { Task, UpdateTaskData } from "../../types/task";

interface TaskCardProps {
  task: Task;
  selected: boolean;
  completed: number;

  onSelect: () => void;

  onUpdate: (id: string, updates: UpdateTaskData) => Promise<void>;

  onDelete: (id: string) => Promise<void>;
}

export default function TaskCard({
  task,
  selected,
  completed,
  onSelect,
  onUpdate,
  onDelete,
}: TaskCardProps) {
  const [editing, setEditing] = useState(false);

  const [title, setTitle] = useState(task.title);
  const [target, setTarget] = useState(task.target);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function startEditing() {
    setTitle(task.title);
    setTarget(task.target);
    setError("");
    setEditing(true);
  }

  async function saveChanges(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setBusy(true);
    setError("");

    try {
      await onUpdate(task.id, {
        title: title.trim(),
        target,
      });

      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setBusy(false);
    }
  }

  async function toggleDone() {
    setBusy(true);
    setError("");

    try {
      await onDelete(task.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка обновления");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError("");

    try {
      await onDelete(task.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка удаления");
      setBusy(false);
    }
  }

  const time = new Date(task.createdAt).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article
      className={`relative rounded-2xl border p-4 transition-colors ${
        selected
          ? "border-[#ff503b] bg-[#fff2ef] ring-1 ring-[#ff503b]/40 dark:bg-[#ff503b]/10"
          : "border-[#d8dde6] bg-white dark:border-[#383a43] dark:bg-[#202127]"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        disabled={task.done || editing}
        aria-label={`Выбрать задачу: ${task.title}`}
        aria-pressed={selected}
        className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-2 focus-visible:outline-[#ff503b] disabled:cursor-default"
      />
      <div className="flex items-start gap-3">
        {/* Completed checkbox */}

        <button
          type="button"
          onClick={toggleDone}
          disabled={busy}
          aria-label={
            task.done
              ? "Вернуть задачу в работу"
              : "Отметить задачу выполненной"
          }
          aria-pressed={task.done}
          className={`relative z-20 mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
            task.done
              ? "border-gray-500 bg-gray-500 text-white"
              : "border-gray-300 dark:border-gray-500"
          }`}
        >
          {task.done && <Check size={13} />}
        </button>

        <div className="min-w-0 flex-1">
          {editing ? (
            <form onSubmit={saveChanges} className="relative z-20 space-y-3">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={140}
                required
                autoFocus
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#ff503b] dark:border-[#444650] dark:bg-[#292b33]"
              />

              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Цель:</span>

                <input
                  type="number"
                  min={1}
                  max={20}
                  value={target}
                  onChange={(e) => setTarget(Number(e.target.value))}
                  className="w-16 rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm dark:border-[#444650] dark:bg-[#292b33]"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="flex items-center gap-1 rounded-lg bg-[#ff503b] px-3 py-2 text-xs font-semibold text-white"
                >
                  <Save size={13} />
                  Сохранить
                </button>

                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  disabled={busy}
                  className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-xs dark:bg-[#292b33]"
                >
                  <X size={13} />
                  Отмена
                </button>
              </div>
            </form>
          ) : (
            <>
              <p
                className={`text-sm font-semibold leading-5 ${
                  task.done
                    ? "text-[#64748b] line-through dark:text-[#9ca3af]"
                    : "text-[#111827] dark:text-white"
                }`}
              >
                {task.title}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#64748b] dark:text-[#a1a1aa]">
                <span className="font-semibold text-[#334155] dark:text-[#e5e7eb]">
                  🍅 {completed}/{task.target}
                </span>

                <span>•</span>

                <span>Добавлено в {time}</span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}

        {!editing && (
          <div className="relative z-20 flex shrink-0 gap-2">
            <button
              type="button"
              onClick={startEditing}
              disabled={busy}
              aria-label="Редактировать задачу"
              title="Редактировать"
              className="text-gray-400 transition hover:text-[#ff503b]"
            >
              <Pencil size={15} />
            </button>

            <button
              type="button"
              onClick={remove}
              disabled={busy}
              aria-label="Удалить задачу"
              title="Удалить"
              className="text-gray-400 transition hover:text-red-500"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs text-red-500">
          {error}
        </p>
      )}
    </article>
  );
}
