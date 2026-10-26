export type PomodoroMode = "focus" | "break";

export type PomodoroStatus =
  | "idle"
  | "running"
  | "paused";

export interface PomodoroState {
  taskId: string | null;
  taskTitle: string | null;
  mode: PomodoroMode;
  status: PomodoroStatus;
  durationSeconds: number;
  remainingSeconds: number;
  endAt: string | null;
}

export interface PomodoroStats {
  total: number;
  today: number;
  byTask: Record<string, number>;
}

export interface PomodoroSnapshot {
  timer: PomodoroState;
  stats: PomodoroStats;
}