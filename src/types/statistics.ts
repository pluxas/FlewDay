export interface StatisticsSession {
  durationSeconds: number;
  completedAt: string;
}

export interface StatisticsResponse {
  sessions: StatisticsSession[];

  overall: {
    totalPomodoros: number;
    totalSeconds: number;
  };
}

export interface ChartPoint {
  date: string;
  label: string;
  pomodoros: number;
  focusSeconds: number;
}