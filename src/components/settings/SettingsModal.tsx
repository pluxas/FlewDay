import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";

import type { PomodoroSettings } from "../../services/settingsApi";

// ------------------------------------
// TYPES
// ------------------------------------

interface SettingsModalProps {
  settings: PomodoroSettings;
  onClose: () => void;

  onSave: (
    settings: PomodoroSettings,
    resetTimer: boolean
  ) => Promise<void>;

  timerStatus?: "idle" | "running" | "paused";
}

// ------------------------------------
// CONSTANTS
// ------------------------------------

const FOCUS_PRESETS = [25, 50, 90, 120];
const BREAK_PRESETS = [5, 10, 20, 30];

// ------------------------------------
// COMPONENT
// ------------------------------------

export default function SettingsModal({
  settings,
  onClose,
  onSave,
  timerStatus = "idle",
}: SettingsModalProps) {

  // ------------------------------------
  // STATES
  // ------------------------------------

  const [focus, setFocus] = useState(
    String(settings.focusMinutes)
  );

  const [breakTime, setBreakTime] = useState(
    String(settings.breakMinutes)
  );

  const [selectedFocus, setSelectedFocus] = useState<number | null>(
    FOCUS_PRESETS.includes(settings.focusMinutes)
      ? settings.focusMinutes
      : null
  );

  const [selectedBreak, setSelectedBreak] = useState<number | null>(
    BREAK_PRESETS.includes(settings.breakMinutes)
      ? settings.breakMinutes
      : null
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ------------------------------------
  // MODAL BEHAVIOR
  // ------------------------------------

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, saving]);

  // ------------------------------------
  // SELECT PRESETS
  // ------------------------------------

  function selectFocus(minutes: number) {
    setFocus(String(minutes));
    setSelectedFocus(minutes);
    setError("");
  }

  function selectBreak(minutes: number) {
    setBreakTime(String(minutes));
    setSelectedBreak(minutes);
    setError("");
  }

  // ------------------------------------
  // SAVE SETTINGS
  // ------------------------------------

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) return;

    const focusMinutes = Number(focus);
    const breakMinutes = Number(breakTime);

    // Validate focus

    if (
      !Number.isInteger(focusMinutes) ||
      focusMinutes < 1 ||
      focusMinutes > 240
    ) {
      setError("Время фокуса должно быть от 1 до 240 минут.");
      return;
    }

    // Validate break

    if (
      !Number.isInteger(breakMinutes) ||
      breakMinutes < 1 ||
      breakMinutes > 90
    ) {
      setError("Время отдыха должно быть от 1 до 90 минут.");
      return;
    }

    // Check changes

    const changed =
      focusMinutes !== settings.focusMinutes ||
      breakMinutes !== settings.breakMinutes;

    if (!changed) {
      onClose();
      return;
    }

    // Check timer status

    const resetTimer = timerStatus !== "idle";

    if (resetTimer) {
      const confirmed = window.confirm(
        "Изменение длительности сбросит текущую сессию Помодоро.\n\nПродолжить?"
      );

      if (!confirmed) return;
    }

    // Save to Backend

    setSaving(true);
    setError("");

    try {
      await onSave(
        {
          focusMinutes,
          breakMinutes,
        },
        resetTimer
      );

      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Не удалось сохранить настройки"
      );
    } finally {
      setSaving(false);
    }
  }

  // ------------------------------------
  // STYLES
  // ------------------------------------

  function presetClass(active: boolean) {
    return `
      flex h-12 w-12 shrink-0
      items-center justify-center
      rounded-full border
      text-sm font-semibold
      transition-all duration-200
      focus-visible:outline-none
      focus-visible:ring-2
      focus-visible:ring-[#ff503b]
      ${
        active
          ? "border-[#18181b] bg-[#18181b] text-white dark:border-[#f5f5f5] dark:bg-[#f5f5f5] dark:text-[#18181b]"
          : "border-[#e1e4ea] bg-white text-[#64748b] hover:border-[#18181b] hover:text-[#18181b] dark:border-[#353841] dark:bg-[#202228] dark:text-[#a1a1aa] dark:hover:border-white dark:hover:text-white"
      }
    `;
  }

  const inputClass = `
    h-11 w-full rounded-xl
    border border-[#e1e4ea]
    bg-[#f8f9fb] px-4
    text-sm font-medium text-[#18181b]
    outline-none transition
    focus:border-[#18181b]
    dark:border-[#353841]
    dark:bg-[#202228]
    dark:text-white
    dark:focus:border-[#a1a1aa]
  `;

  // ------------------------------------
  // RENDER
  // ------------------------------------

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/45 p-4
        backdrop-blur-[8px]
      "
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !saving
        ) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pomodoro-settings-title"
        className="
          max-h-[90vh]
          w-full max-w-[380px]
          overflow-y-auto
          rounded-[28px]
          border border-[#e5e7eb]
          bg-white p-7
          shadow-[0_24px_70px_rgba(0,0,0,0.18)]
          dark:border-[#30333b]
          dark:bg-[#15171c]
        "
      >

        {/* HEADER */}

        <div className="mb-8 flex items-center justify-between">
          <h2
            id="pomodoro-settings-title"
            className="text-[22px] font-bold tracking-tight text-[#18181b] dark:text-white"
          >
            Settings
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Закрыть настройки"
            className="
              flex h-9 w-9 items-center justify-center
              rounded-full bg-[#f3f4f6]
              text-[#6b7280] transition
              hover:bg-[#e5e7eb]
              disabled:opacity-50
              dark:bg-[#24262e]
              dark:text-[#a1a1aa]
              dark:hover:bg-[#30333b]
            "
          >
            <X size={17} />
          </button>
        </div>

        {/* FORM */}

        <form onSubmit={handleSubmit}>

          {/* FOCUS DURATION */}

          <section>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[#18181b] dark:text-white">
                Length Options
              </h3>

              <p className="mt-1 text-xs text-[#9399a6]">
                Focus duration in minutes
              </p>
            </div>

            {/* FOCUS PRESETS */}

            <div className="mb-5 flex items-center justify-between gap-2">
              {FOCUS_PRESETS.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => selectFocus(minutes)}
                  aria-pressed={selectedFocus === minutes}
                  className={presetClass(
                    selectedFocus === minutes
                  )}
                >
                  {minutes}
                </button>
              ))}
            </div>

            {/* CUSTOM FOCUS */}

            <label className="block">
              <span className="mb-2 block text-xs font-medium text-[#64748b] dark:text-[#a1a1aa]">
                Custom (min)
              </span>

              <input
                type="number"
                min={1}
                max={240}
                step={1}
                value={focus}
                onChange={(event) => {
                  setFocus(event.target.value);
                  setSelectedFocus(null);
                  setError("");
                }}
                className={inputClass}
              />
            </label>
          </section>

          {/* DIVIDER */}

          <div className="my-7 h-px bg-[#eceef2] dark:bg-[#30333b]" />

          {/* BREAK DURATION */}

          <section>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-[#18181b] dark:text-white">
                Break Length
              </h3>

              <p className="mt-1 text-xs text-[#9399a6]">
                Rest duration in minutes
              </p>
            </div>

            {/* BREAK PRESETS */}

            <div className="mb-5 flex items-center justify-between gap-2">
              {BREAK_PRESETS.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => selectBreak(minutes)}
                  aria-pressed={selectedBreak === minutes}
                  className={presetClass(
                    selectedBreak === minutes
                  )}
                >
                  {minutes}
                </button>
              ))}
            </div>

            {/* CUSTOM BREAK */}

            <label className="block">
              <span className="mb-2 block text-xs font-medium text-[#64748b] dark:text-[#a1a1aa]">
                Custom break (min)
              </span>

              <input
                type="number"
                min={1}
                max={90}
                step={1}
                value={breakTime}
                onChange={(event) => {
                  setBreakTime(event.target.value);
                  setSelectedBreak(null);
                  setError("");
                }}
                className={inputClass}
              />
            </label>
          </section>

          {/* ERROR */}

          {error && (
            <p
              role="alert"
              className="mt-5 rounded-xl bg-red-50 p-3 text-xs text-red-500 dark:bg-red-500/10"
            >
              {error}
            </p>
          )}

          {/* FOOTER */}

          <div className="mt-8 flex items-center justify-end gap-3">

            {/* CANCEL */}

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="
                h-11 rounded-full
                border border-[#e1e4ea]
                bg-white px-5
                text-xs font-bold tracking-wide
                text-[#64748b] transition
                hover:bg-[#f3f4f6]
                disabled:opacity-50
                dark:border-[#353841]
                dark:bg-transparent
                dark:text-[#a1a1aa]
                dark:hover:bg-[#24262e]
              "
            >
              CANCEL
            </button>

            {/* APPLY */}

            <button
              type="submit"
              disabled={saving}
              className="
                h-11 rounded-full
                bg-[#18181b] px-6
                text-xs font-bold tracking-wide
                text-white transition
                hover:bg-[#303036]
                disabled:opacity-50
                dark:bg-[#f5f5f5]
                dark:text-[#18181b]
                dark:hover:bg-white
              "
            >
              {saving ? "SAVING..." : "APPLY"}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}