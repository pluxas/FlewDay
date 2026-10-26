export interface PomodoroSettings {
  focusMinutes: number;
  breakMinutes: number;
}

export async function saveSettings(
  settings: PomodoroSettings,
  resetTimer = false
): Promise<PomodoroSettings> {
  const response = await fetch("/api/settings", {
    method: "PATCH",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...settings,
      resetTimer,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error || "Не удалось сохранить настройки"
    );
  }

  return data.settings;
}