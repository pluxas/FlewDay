import type { StatisticsResponse } from "../types/statistics";

export async function getStatistics(
  from: string,
  to: string,
  signal?: AbortSignal,
): Promise<StatisticsResponse> {
  const params = new URLSearchParams({
    from,
    to,
  });

  const response = await fetch(`/api/statistics?${params.toString()}`, {
    credentials: "same-origin",
    signal,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Не удалось загрузить статистику");
  }

  return data as StatisticsResponse;
}
