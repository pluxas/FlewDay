import { useCallback, useEffect, useState } from "react";

import * as pomodoroApi from "../services/pomodoroApi";

import type { PomodoroMode, PomodoroSnapshot } from "../types/pomodoro";

export function usePomodoro() {
  const [snapshot, setSnapshot] = useState<PomodoroSnapshot | null>(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [error, setError] = useState("");

  const [now, setNow] = useState(Date.now());

  // ---------------------------------
  // SYNC SERVER
  // ---------------------------------

  const refresh = useCallback(async () => {
    const data = await pomodoroApi.getPomodoroState();

    setSnapshot(data);
    setNow(Date.now());

    return data;
  }, []);

  // Первая загрузка

  useEffect(() => {
    let active = true;

    pomodoroApi
      .getPomodoroState()
      .then((data) => {
        if (active) {
          setSnapshot(data);
          setNow(Date.now());
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Ошибка загрузки Помодоро",
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // ---------------------------------
  // LOCAL CLOCK
  // ---------------------------------

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  // ---------------------------------
  // BACKGROUND SYNCHRONIZATION
  // ---------------------------------

  useEffect(() => {
    if (snapshot?.timer.status !== "running") {
      return;
    }

    const interval = window.setInterval(() => {
      refresh().catch(console.error);
    }, 5000);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        refresh().catch(console.error);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(interval);

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [snapshot?.timer.status, refresh]);

  async function executeAction(action: () => Promise<unknown>) {
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      await action();

      // После каждого действия получаем
      // актуальное состояние с сервера.

      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка работы таймера");
    } finally {
      setBusy(false);
    }
  }

  // ---------------------------------
  // ACTIONS
  // ---------------------------------

  async function start(taskId?: string) {
    await executeAction(() => pomodoroApi.startPomodoro(taskId));
  }

  async function pause() {
    await executeAction(pomodoroApi.pausePomodoro);
  }

  async function reset() {
    await executeAction(pomodoroApi.resetPomodoro);
  }

  async function changeMode(mode: PomodoroMode) {
    await executeAction(() => pomodoroApi.changePomodoroMode(mode));
  }

  // async function addManualPomodoro(taskId: string): Promise<void> {
  //   if (manualBusyRef.current || busy) return;
  
  //   manualBusyRef.current = true;
  
  //   setBusy(true);
  //   setError("");
  
  //   try {
  //     await pomodoroApi.addManualPomodoro(taskId);
  
  //     // Получаем обновлённую статистику.
  //     await refresh();
  //   } catch (err) {
  //     const message =
  //       err instanceof Error
  //         ? err.message
  //         : "Ошибка добавления Помодоро";
  
  //     setError(message);
  
  //     throw err instanceof Error ? err : new Error(message);
  //   } finally {
  //     manualBusyRef.current = false;
  //     setBusy(false);
  //   }
  // }

  async function selectTask(taskId: string, restart = false): Promise<boolean> {
    if (busy) return false;

    setBusy(true);
    setError("");

    try {
      await pomodoroApi.selectPomodoroTask(taskId, restart);

      // Получаем новый taskId и состояние таймера.
      await refresh();

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка выбора задачи");

      return false;
    } finally {
      setBusy(false);
    }
  }

  // async function addManualPomodoro(taskId: string) {
  //   await executeAction(() => pomodoroApi.addManualPomodoro(taskId));
  // }

  // ---------------------------------
  // REMAINING TIME
  // ---------------------------------

  const timer = snapshot?.timer ?? null;

  let remainingSeconds = timer?.remainingSeconds ?? 25 * 60;

  if (timer?.status === "running" && timer.endAt) {
    const difference = new Date(timer.endAt).getTime() - now;

    remainingSeconds = Math.max(
      0,
      Math.min(timer.remainingSeconds, Math.ceil(difference / 1000)),
    );
  }

  return {
    timer,
    stats: snapshot?.stats ?? {
      total: 0,
      today: 0,
      byTask: {},
    },
    
    selectTask,
    
    remainingSeconds,

    loading,
    busy,
    error,

    start,
    pause,
    reset,
    changeMode,
    refresh,
  };
}
