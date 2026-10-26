import { useEffect, useRef, useState } from "react";
import { Bell, BellRing, X } from "lucide-react";

import { getPomodoroState } from "../../services/pomodoroApi";

type Permission = NotificationPermission | "unsupported";

function getPermission(): Permission {
  if (!("Notification" in window)) {
    return "unsupported";
  }

  return Notification.permission;
}

export default function PomodoroNotifier() {
  const [permission, setPermission] = useState<Permission>(
    getPermission
  );

  const [soundEnabled, setSoundEnabled] = useState(false);
  const [message, setMessage] = useState("");

  const audioRef = useRef<AudioContext | null>(null);
  const timeoutRef = useRef<number | null>(null);

  function playSound() {
    const context = audioRef.current;

    if (!context || context.state !== "running") {
      return;
    }

    const frequencies = [784, 988];

    frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      const start = context.currentTime + index * 0.2;

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;

      gain.gain.setValueAtTime(0.001, start);

      gain.gain.exponentialRampToValueAtTime(
        0.15,
        start + 0.03
      );

      gain.gain.exponentialRampToValueAtTime(
        0.001,
        start + 0.3
      );

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start(start);
      oscillator.stop(start + 0.3);
    });
  }

  async function enableNotifications() {
    try {
      // Запускаем разблокировку звука.
      if (!audioRef.current) {
        audioRef.current = new AudioContext();
      }
  
      const audioPromise = audioRef.current.resume();
  
      // Сразу запрашиваем разрешение у браузера.
      // Не ждём завершения других операций.
      const permissionPromise =
        "Notification" in window &&
        Notification.permission === "default"
          ? Notification.requestPermission()
          : null;
  
      await audioPromise;
  
      setSoundEnabled(
        audioRef.current.state === "running"
      );
  
      if (permissionPromise) {
        const result = await permissionPromise;
        setPermission(result);
      } else {
        setPermission(getPermission());
      }
    } catch (error) {
      console.error("Ошибка уведомлений:", error);
  
      setMessage(
        "Не удалось включить уведомления. Проверь разрешения Firefox."
      );
    }
  }

  function notifyCompleted(count: number) {
    const text =
      count === 1
        ? "🍅 Помодоро завершён! Время отдохнуть."
        : `🍅 Завершено новых Помодоро: ${count}`;


    setMessage(text);

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      setMessage("");
    }, 7000);

    playSound();

    if (
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        new Notification("FlewDay 🍅", {
          body: text,
          tag: "flewday-pomodoro-completed",
        });
      } catch (error) {
        console.error(
          "Не удалось показать системное уведомление:",
          error
        );
      }
    }
  }

  useEffect(() => {
    let cancelled = false;
    let checking = false;

    let previousTotal: number | null = null;

    async function checkPomodoro() {
      if (checking || cancelled) return;

      checking = true;

      try {
        const data = await getPomodoroState();

        if (cancelled) return;

        const currentTotal = data.stats.total;

        if (
          previousTotal !== null &&
          currentTotal > previousTotal
        ) {
          notifyCompleted(currentTotal - previousTotal);
        }

        previousTotal = currentTotal;
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Ошибка проверки Помодоро:",
            error
          );
        }
      } finally {
        checking = false;
      }
    }

    void checkPomodoro();

    const interval = window.setInterval(() => {
      void checkPomodoro();
    }, 5000);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void checkPomodoro();
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      cancelled = true;

      window.clearInterval(interval);

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      if (audioRef.current) {
        void audioRef.current.close();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-3">

      {message && (
        <div
          role="status"
          className="flex w-full max-w-[350px] items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl dark:border-[#383a43] dark:bg-[#202127]"
        >
          <span className="text-2xl">🍅</span>

          <p className="flex-1 text-sm font-medium">
            {message}
          </p>

          <button
            type="button"
            onClick={() => setMessage("")}
            aria-label="Закрыть уведомление"
            className="text-gray-400 hover:text-[#ff503b]"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={enableNotifications}
        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-xs font-semibold shadow-lg transition hover:bg-gray-100 dark:border-[#383a43] dark:bg-[#202127] dark:hover:bg-[#292b33]"
      >
        {soundEnabled ? (
          <BellRing size={16} className="text-[#ff503b]" />
        ) : (
          <Bell size={16} />
        )}

        {soundEnabled && permission === "granted"
          ? "Уведомления включены"
          : soundEnabled
            ? "Звук включён"
            : "Включить уведомления"}
      </button>

    </div>
  );
}