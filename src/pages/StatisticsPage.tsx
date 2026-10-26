import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";

import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flame,
  Target,
  type LucideIcon,
  ArrowLeft,
} from "lucide-react";

// ------------------------------------
// TYPES
// ------------------------------------

type Metric = "pomodoros" | "minutes";

interface FocusSession {
  id: string;
  taskId: string | null;
  taskTitle: string | null;
  taskCreatedAt: string | null;
  durationSeconds: number;
  completedAt: string;
}

interface StatisticsResponse {
  sessions: FocusSession[];
  breakMinutes: number;
}

interface DayInfo {
  date: Date;
  key: string;
  label: string;
  count: number;
  minutes: number;
}

interface TaskGroup {
  key: string;
  title: string;
  createdAt: string | null;
  lastFocusAt: string;
  count: number;
  seconds: number;
}

// ------------------------------------
// CONSTANTS
// ------------------------------------

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const CARD = `
  rounded-[26px]
  border border-[#dfe3ea]
  bg-white
  shadow-sm
  dark:border-[#353741]
  dark:bg-[#202127]
`;

// ------------------------------------
// DATE HELPERS
// ------------------------------------

function getMonday(date: Date) {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));

  return result;
}

function addDays(date: Date, amount: number) {
  const result = new Date(date);

  result.setDate(result.getDate() + amount);

  return result;
}

function dayKey(date: Date) {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function countSeconds(sessions: FocusSession[]) {
  return sessions.reduce(
    (total, session) => total + session.durationSeconds,
    0,
  );
}

function minutesLabel(minutes: number) {
  const rounded = Math.round(minutes);

  const hours = Math.floor(rounded / 60);

  const mins = rounded % 60;

  if (hours === 0) {
    return `${mins} мин`;
  }

  return `${hours} ч ${mins} мин`;
}

function timeLabel(value: string) {
  return new Date(value).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function weekLabel(start: Date) {
  const end = addDays(start, 6);

  const firstMonth = start.toLocaleDateString("ru-RU", { month: "long" });

  const lastMonth = end.toLocaleDateString("ru-RU", { month: "long" });

  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()}–${end.getDate()} ${lastMonth}`;
  }

  return (
    `${start.getDate()} ${firstMonth} – ` + `${end.getDate()} ${lastMonth}`
  );
}

// ------------------------------------
// PRODUCTIVITY PEAK
// ------------------------------------

function peakHours(sessions: FocusSession[]) {
  if (sessions.length === 0) {
    return "Пока нет данных";
  }

  // Четырёхчасовые интервалы.
  const timeSlots = Array.from({ length: 11 }, (_, index) => index * 2);

  let bestStart = 0;
  let bestCount = -1;

  for (const start of timeSlots) {
    const count = sessions.filter((session) => {
      const hour = new Date(session.completedAt).getHours();

      return hour >= start && hour < start + 4;
    }).length;

    if (count > bestCount) {
      bestCount = count;
      bestStart = start;
    }
  }

  const hh = (hour: number) => String(hour).padStart(2, "0");

  return `${hh(bestStart)}:00–${hh(bestStart + 4)}:00`;
}

// ------------------------------------
// GROUP SESSIONS BY TASK
// ------------------------------------

function groupByTask(sessions: FocusSession[]): TaskGroup[] {
  const groups = new Map<string, TaskGroup>();

  for (const session of sessions) {
    const key = session.taskId ?? "__deleted_tasks__";

    const existing = groups.get(key);

    if (existing) {
      existing.count += 1;

      existing.seconds += session.durationSeconds;

      if (session.completedAt > existing.lastFocusAt) {
        existing.lastFocusAt = session.completedAt;
      }

      continue;
    }

    groups.set(key, {
      key,

      title: session.taskTitle ?? "Удалённые задачи",

      createdAt: session.taskCreatedAt,

      lastFocusAt: session.completedAt,

      count: 1,

      seconds: session.durationSeconds,
    });
  }

  return [...groups.values()].sort((a, b) => b.seconds - a.seconds);
}

// ------------------------------------
// SUMMARY CARD
// ------------------------------------

interface SummaryCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}

function SummaryCard({ icon: Icon, label, value, detail }: SummaryCardProps) {
  return (
    <div className={`${CARD} min-w-0 p-5`}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <span
          className="
            text-xs font-semibold
            text-[#778295]
            dark:text-[#a2aabc]
          "
        >
          {label}
        </span>

        <Icon size={17} className="shrink-0 text-[#ff503b]" />
      </div>

      <div
        className="
          truncate
          text-[26px] font-bold
          tracking-tight
          text-[#172033]
          dark:text-white
        "
      >
        {value}
      </div>

      <p
        className="
          mt-2 text-xs
          text-[#8390a3]
          dark:text-[#9ca8bc]
        "
      >
        {detail}
      </p>
    </div>
  );
}

// ------------------------------------
// MAIN STATISTICS PAGE
// ------------------------------------

export default function StatisticsPage() {
  // ------------------------------------
  // STATES
  // ------------------------------------

  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));

  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const [metric, setMetric] = useState<Metric>("pomodoros");

  const [sessions, setSessions] = useState<FocusSession[]>([]);

  const [breakMinutes, setBreakMinutes] = useState(5);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ------------------------------------
  // LOAD STATISTICS
  // ------------------------------------

  useEffect(() => {
    const controller = new AbortController();

    // Запрашиваем две недели:
    // выбранную и предыдущую.

    const from = addDays(weekStart, -7).toISOString();

    const to = addDays(weekStart, 7).toISOString();

    const params = new URLSearchParams({
      from,
      to,
    });

    async function loadStatistics() {
      setLoading(true);

      setError("");

      try {
        const response = await fetch(`/api/statistics/week?${params}`, {
          credentials: "include",
          signal: controller.signal,
        });

        const data = (await response.json()) as StatisticsResponse & {
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error || "Не удалось загрузить статистику");
        }

        if (controller.signal.aborted) {
          return;
        }

        setSessions(data.sessions);

        setBreakMinutes(data.breakMinutes);
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : "Ошибка загрузки");

          setSessions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadStatistics();

    return () => {
      controller.abort();
    };
  }, [weekStart]);

  // ------------------------------------
  // WEEK DAYS
  // ------------------------------------

  const weekKeys = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        dayKey(addDays(weekStart, index)),
      ),
    [weekStart],
  );

  const previousKeys = useMemo(
    () =>
      new Set(
        Array.from({ length: 7 }, (_, index) =>
          dayKey(addDays(weekStart, index - 7)),
        ),
      ),
    [weekStart],
  );

  // ------------------------------------
  // CURRENT WEEK SESSIONS
  // ------------------------------------

  const currentSessions = useMemo(
    () =>
      sessions.filter((session) =>
        weekKeys.includes(dayKey(new Date(session.completedAt))),
      ),
    [sessions, weekKeys],
  );

  // ------------------------------------
  // PREVIOUS WEEK SESSIONS
  // ------------------------------------

  const previousSessions = useMemo(
    () =>
      sessions.filter((session) =>
        previousKeys.has(dayKey(new Date(session.completedAt))),
      ),
    [sessions, previousKeys],
  );

  // ------------------------------------
  // DAILY STATISTICS
  // ------------------------------------

  const days = useMemo<DayInfo[]>(
    () =>
      weekKeys.map((key, index) => {
        const daySessions = currentSessions.filter(
          (session) => dayKey(new Date(session.completedAt)) === key,
        );

        return {
          key,

          date: addDays(weekStart, index),

          label: WEEKDAYS[index],

          count: daySessions.length,

          minutes: Math.round(countSeconds(daySessions) / 60),
        };
      }),
    [weekKeys, currentSessions, weekStart],
  );

  // ------------------------------------
  // KPI CALCULATIONS
  // ------------------------------------

  const totalFocusMinutes = Math.round(countSeconds(currentSessions) / 60);

  const previousMinutes = Math.round(countSeconds(previousSessions) / 60);

  const activeDays = days.filter((day) => day.count > 0).length;

  const bestDay = days.reduce<DayInfo | null>(
    (best, day) => (!best || day.count > best.count ? day : best),
    null,
  );

  const bestWithSessions = bestDay && bestDay.count > 0 ? bestDay : null;

  const comparison =
    previousMinutes > 0
      ? `${totalFocusMinutes >= previousMinutes ? "+" : ""}${Math.round(
          ((totalFocusMinutes - previousMinutes) / previousMinutes) * 100,
        )}% к прошлой неделе`
      : "Нет данных прошлой недели";

  // ------------------------------------
  // SELECTED DAY DETAILS
  // ------------------------------------

  const detailSessions = selectedDay
    ? currentSessions.filter(
        (session) => dayKey(new Date(session.completedAt)) === selectedDay,
      )
    : currentSessions;

  const detailGroups = groupByTask(detailSessions);

  const selectedDate = days.find((day) => day.key === selectedDay);

  const detailTitle = selectedDate
    ? selectedDate.date.toLocaleDateString("ru-RU", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
    : "Вся неделя";

  const bestTime = peakHours(detailSessions);

  // ------------------------------------
  // CHART CALCULATIONS
  // ------------------------------------

  const chartMaximum = Math.max(
    1,
    ...days.map((day) => (metric === "pomodoros" ? day.count : day.minutes)),
  );

  // Отдых рассчитывается приблизительно,
  // поскольку история перерывов не ведётся.

  const estimatedRestMinutes = currentSessions.length * breakMinutes;

  const ratio =
    totalFocusMinutes + estimatedRestMinutes > 0
      ? (totalFocusMinutes / (totalFocusMinutes + estimatedRestMinutes)) * 100
      : 0;

  // ------------------------------------
  // WEEK NAVIGATION
  // ------------------------------------

  function changeWeek(offset: number) {
    setWeekStart((previous) => addDays(previous, offset * 7));

    setSelectedDay(null);
  }

  // ------------------------------------
  // RENDER
  // ------------------------------------

  return (
    <main
      className="
        mx-auto
        w-full
        max-w-[1140px]
        px-5
        pb-12
        pt-5
        md:pr-20
      "
    >
      {/* PAGE HEADER */}

      <div
        className="
          mb-5
          flex flex-wrap
          items-center justify-between
          gap-4
        "
      >
        <div className="flex items-center gap-3">
          {/* BACK TO DASHBOARD */}

          <Link
            to="/"
            title="Вернуться на главную"
            aria-label="Вернуться на главную"
            className="
              flex h-11 w-11
              shrink-0 items-center justify-center
              rounded-full
              border border-[#dfe3ea]
              bg-white
              text-[#374151]
              transition-all duration-200
              hover:border-[#ff503b]
              hover:bg-[#ff503b]/10
              hover:text-[#ff503b]
              dark:border-[#353741]
              dark:bg-[#202127]
              dark:text-white
              dark:hover:border-[#ff503b]
              dark:hover:text-[#ff503b]
            "
          >
            <ArrowLeft size={20} strokeWidth={1.8} />
          </Link>

          {/* PAGE TITLE */}

          <div>
            <p
              className="
                mb-1
                text-xs font-semibold
                uppercase
                tracking-[0.14em]
                text-[#ff503b]
              "
            >
              Обзор продуктивности
            </p>

            <h1
              className="
                text-2xl font-bold
                tracking-tight
                text-[#182033]
                dark:text-white
              "
            >
              Статистика
            </h1>
          </div>
        </div>

        {/* WEEK NAVIGATION */}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changeWeek(-1)}
            aria-label="Предыдущая неделя"
            className={`
              ${CARD}
              flex h-9 w-9
              items-center justify-center
              transition
              hover:border-[#ff503b]
            `}
          >
            <ChevronLeft size={17} />
          </button>

          <span
            className="
              min-w-[142px]
              text-center text-sm
              font-semibold
              text-[#374151]
              dark:text-[#e5e7eb]
            "
          >
            {weekLabel(weekStart)}
          </span>

          <button
            type="button"
            onClick={() => changeWeek(1)}
            aria-label="Следующая неделя"
            className={`
              ${CARD}
              flex h-9 w-9
              items-center justify-center
              transition
              hover:border-[#ff503b]
            `}
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      {/* ERROR */}

      {error && (
        <div
          role="alert"
          className="
            mb-4 rounded-2xl
            border border-red-500/30
            bg-red-500/10
            p-4
            text-sm text-red-500
          "
        >
          {error}
        </div>
      )}

      {/* ================================== */}
      {/* WEEK SELECTOR */}
      {/* ================================== */}

      <div
        className={`
          ${CARD}
          mb-4 p-3 sm:p-4
        `}
      >
        <div
          className="
            mb-3
            flex items-center justify-between
            gap-3 px-1
          "
        >
          <span
            className="
              text-xs font-semibold
              text-[#7d8797]
              dark:text-[#a0a9b9]
            "
          >
            ВЫБЕРИ ДЕНЬ
          </span>

          <button
            type="button"
            onClick={() => setSelectedDay(null)}
            aria-pressed={selectedDay === null}
            className={`
              rounded-full
              px-3 py-1.5
              text-xs font-semibold
              transition

              ${
                selectedDay === null
                  ? "bg-[#ff503b] text-white"
                  : "bg-[#f1f3f6] text-[#526073] hover:text-[#ff503b] dark:bg-[#292b33] dark:text-[#bdc3d0]"
              }
            `}
          >
            Вся неделя (7 дней)
          </button>
        </div>

        <div
          className="
            grid grid-cols-7
            gap-1.5 sm:gap-2
          "
        >
          {days.map((day) => (
            <button
              key={day.key}
              type="button"
              onClick={() => setSelectedDay(day.key)}
              aria-pressed={selectedDay === day.key}
              className={`
                min-w-0
                rounded-2xl
                border
                px-1 py-3
                text-center
                transition-colors

                ${
                  selectedDay === day.key
                    ? "border-[#ff503b] bg-[#ff503b]/10"
                    : "border-transparent bg-[#f4f5f8] hover:border-[#ff503b]/40 dark:bg-[#181a20]"
                }
              `}
            >
              <span
                className="
                  block text-[10px]
                  uppercase
                  text-[#8f9aac]
                "
              >
                {day.label}
              </span>

              <span
                className="
                  mt-1 block
                  text-sm font-bold
                  text-[#172033]
                  dark:text-white
                "
              >
                {day.date.getDate()}
              </span>

              <span
                className="
                  mt-1 block
                  text-[10px] font-semibold
                  text-[#ff503b]
                "
              >
                {day.count} 🍅
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ================================== */}
      {/* KPI SUMMARY */}
      {/* ================================== */}

      <div
        className="
          mb-4
          grid grid-cols-1
          gap-3
          sm:grid-cols-2
          lg:grid-cols-4
        "
      >
        {/* CARD 1 */}

        <SummaryCard
          icon={Flame}
          label="Всего Помодоро за неделю"
          value={`${currentSessions.length} 🍅`}
          detail={`Среднее: ${(currentSessions.length / 7)
            .toFixed(1)
            .replace(".", ",")} 🍅 в день`}
        />

        {/* CARD 2 */}

        <SummaryCard
          icon={Clock3}
          label="Время в фокусе"
          value={minutesLabel(totalFocusMinutes)}
          detail={comparison}
        />

        {/* CARD 3 */}

        <SummaryCard
          icon={Target}
          label="Активных дней"
          value={`${activeDays} / 7`}
          detail={`${Math.round((activeDays / 7) * 100)}% дней с фокусом`}
        />

        {/* CARD 4 */}

        <SummaryCard
          icon={CalendarDays}
          label="Лучший день недели"
          value={
            bestWithSessions
              ? `${bestWithSessions.label} • ${bestWithSessions.count} 🍅`
              : "Нет данных"
          }
          detail={
            bestWithSessions
              ? minutesLabel(bestWithSessions.minutes) + " фокуса"
              : "Начни с первой сессии"
          }
        />
      </div>

      {/* ================================== */}
      {/* MAIN GRID */}
      {/* ================================== */}

      <div
        className="
          grid grid-cols-1
          items-start
          gap-4
          lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]
        "
      >
        {/* ================================== */}
        {/* LEFT: FOCUS CHART */}
        {/* ================================== */}

        <section
          className={`
            ${CARD}
            min-w-0
            p-5 sm:p-6
          `}
        >
          {/* CHART HEADER */}

          <div
            className="
              mb-5
              flex flex-wrap
              items-center justify-between
              gap-3
            "
          >
            <div>
              <h2
                className="
                  text-base font-bold
                  text-[#172033]
                  dark:text-white
                "
              >
                График фокуса
              </h2>

              <p
                className="
                  mt-1 text-xs
                  text-[#8a95a7]
                "
              >
                Помодоро за 7 дней
              </p>
            </div>

            {/* METRIC SWITCH */}

            <div
              className="
                flex rounded-full
                bg-[#f0f2f6]
                p-1
                dark:bg-[#181a20]
              "
            >
              {(["pomodoros", "minutes"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMetric(value)}
                  aria-pressed={metric === value}
                  className={`
                    rounded-full
                    px-3 py-2
                    text-[11px]
                    font-semibold
                    transition

                    ${
                      metric === value
                        ? "bg-white text-[#ff503b] shadow-sm dark:bg-[#30323b] dark:text-white"
                        : "text-[#7b8797] dark:text-[#9da5b7]"
                    }
                  `}
                >
                  {value === "pomodoros" ? "🍅 Помодоро" : "Минуты"}
                </button>
              ))}
            </div>
          </div>

          {/* CHART BARS */}

          <div
            className="
              flex h-[242px]
              items-end justify-between
              gap-2
              border-b
              border-[#e7e9ee]
              px-1 pb-3
              dark:border-[#343741]
            "
          >
            {days.map((day) => {
              const value = metric === "pomodoros" ? day.count : day.minutes;

              const height = value
                ? Math.max(9, (value / chartMaximum) * 170)
                : 5;

              const active = selectedDay === day.key;

              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() => setSelectedDay(day.key)}
                  aria-pressed={active}
                  title={`
                    ${day.label}: ${value}
                    ${metric === "pomodoros" ? "Помодоро" : "мин"}
                  `}
                  className="
                    group
                    flex h-full
                    min-w-0 flex-1
                    flex-col
                    items-center
                    justify-end
                    gap-3
                    rounded-xl
                    focus-visible:outline-2
                    focus-visible:outline-[#ff503b]
                  "
                >
                  {/* VALUE */}

                  <span
                    className={`
                      text-xs font-bold

                      ${
                        active
                          ? "text-[#ff503b]"
                          : "text-[#64748b] dark:text-[#c0c7d3]"
                      }
                    `}
                  >
                    {value}
                  </span>

                  {/* BAR */}

                  <div
                    className="
                      flex h-[170px]
                      w-full
                      items-end
                      justify-center
                    "
                  >
                    <motion.div
                      initial={false}
                      animate={{ height }}
                      transition={{
                        duration: 0.35,
                        ease: "easeOut",
                      }}
                      className={`
                        w-full
                        max-w-[48px]
                        rounded-t-xl
                        transition-colors

                        ${
                          active
                            ? "bg-[#ff503b]"
                            : "bg-[#ff503b]/60 group-hover:bg-[#ff503b]/90 dark:bg-[#454956] dark:group-hover:bg-[#ff503b]/70"
                        }
                      `}
                    />
                  </div>

                  {/* DAY NAME */}

                  <span
                    className={`
                      text-xs font-semibold

                      ${active ? "text-[#ff503b]" : "text-[#8590a1]"}
                    `}
                  >
                    {day.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ================================== */}
          {/* FOCUS / BREAK SUMMARY */}
          {/* ================================== */}

          <div
            className="
              mt-6
              rounded-2xl
              bg-[#f5f6f9]
              p-4
              dark:bg-[#292b33]
            "
          >
            <div
              className="
                mb-3
                flex flex-wrap
                items-center justify-between
                gap-2
                text-xs
              "
            >
              <span
                className="
                  font-semibold
                  text-[#5f6d7f]
                  dark:text-[#c0c7d3]
                "
              >
                Фокус / расчётный отдых за неделю
              </span>

              <span
                className="
                  font-semibold
                  text-[#172033]
                  dark:text-white
                "
              >
                {totalFocusMinutes} / ~{estimatedRestMinutes} мин
              </span>
            </div>

            {/* PROGRESS BAR */}

            <div
              className="
                h-2.5
                overflow-hidden
                rounded-full
                bg-[#dfe3ea]
                dark:bg-[#41444e]
              "
            >
              <motion.div
                initial={false}
                animate={{
                  width: `${ratio}%`,
                }}
                transition={{
                  duration: 0.4,
                }}
                className="
                  h-full
                  rounded-full
                  bg-[#ff503b]
                "
              />
            </div>

            <p
              className="
                mt-2
                text-[11px]
                text-[#8a95a7]
              "
            >
              Отдых рассчитан по настройкам, а не по фактически проведённому
              времени.
            </p>
          </div>
        </section>

        {/* ================================== */}
        {/* RIGHT: TASK DETAILS */}
        {/* ================================== */}

        <section
          className={`
            ${CARD}
            min-w-0
            p-5 sm:p-6
          `}
        >
          {/* DETAILS HEADER */}

          <div
            className="
              mb-5
              flex items-start justify-between
              gap-3
            "
          >
            <div>
              <h2
                className="
                  text-base font-bold
                  text-[#172033]
                  dark:text-white
                "
              >
                Фокус по задачам
              </h2>

              <p
                className="
                  mt-1
                  text-xs capitalize
                  text-[#8a95a7]
                "
              >
                {detailTitle}
              </p>
            </div>

            <span
              className="
                shrink-0
                rounded-full
                bg-[#ff503b]/10
                px-3 py-1.5
                text-xs font-bold
                text-[#ff503b]
              "
            >
              {detailSessions.length} 🍅
            </span>
          </div>

          {/* TASKS LIST */}

          <div
            className="
              max-h-[344px]
              space-y-2.5
              overflow-y-auto
              pr-1
            "
            style={{
              scrollbarWidth: "thin",
            }}
          >
            {detailGroups.length ? (
              detailGroups.map((task) => (
                <div
                  key={task.key}
                  className="
                    rounded-2xl
                    border border-[#e3e6ec]
                    bg-[#f9fafb]
                    p-4
                    dark:border-[#343741]
                    dark:bg-[#272930]
                  "
                >
                  <div
                    className="
                      mb-2
                      flex items-center justify-between
                      gap-3
                    "
                  >
                    {/* TASK TITLE */}

                    <span
                      className="
                        min-w-0
                        break-words
                        text-sm font-semibold
                        text-[#172033]
                        dark:text-white
                      "
                    >
                      {task.title}
                    </span>

                    {/* POMODORO COUNT */}

                    <span
                      className="
                        shrink-0
                        text-xs font-bold
                        text-[#ff503b]
                      "
                    >
                      🍅 {task.count}
                    </span>
                  </div>

                  {/* TASK DETAILS */}

                  <div
                    className="
                      flex flex-wrap
                      gap-x-3 gap-y-1
                      text-[11px]
                      text-[#8390a3]
                      dark:text-[#a4acba]
                    "
                  >
                    {task.createdAt && (
                      <span>Добавлено в {timeLabel(task.createdAt)}</span>
                    )}

                    <span>Последний фокус в {timeLabel(task.lastFocusAt)}</span>

                    <span>{minutesLabel(task.seconds / 60)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div
                className="
                  rounded-2xl
                  border border-dashed
                  border-[#dfe3ea]
                  p-7
                  text-center
                  text-sm
                  text-[#8a95a7]
                  dark:border-[#363942]
                "
              >
                {loading
                  ? "Загружаем статистику..."
                  : "За этот период завершённых Помодоро нет"}
              </div>
            )}
          </div>

          {/* ================================== */}
          {/* PRODUCTIVITY PEAK */}
          {/* ================================== */}

          <div
            className="
              mt-5
              flex items-start
              gap-3
              rounded-2xl
              bg-[#fff2ee]
              p-4
              dark:bg-[#ff503b]/10
            "
          >
            <Activity
              size={19}
              className="
                mt-0.5
                shrink-0
                text-[#ff503b]
              "
            />

            <div>
              <p
                className="
                  text-xs font-bold
                  text-[#a24639]
                  dark:text-[#ff8a7b]
                "
              >
                Пик продуктивности
              </p>

              <p
                className="
                  mt-1
                  text-lg font-bold
                  text-[#172033]
                  dark:text-white
                "
              >
                {bestTime}
              </p>

              <p
                className="
                  mt-1
                  text-[11px]
                  text-[#9a7d78]
                  dark:text-[#bda5a1]
                "
              >
                По времени завершения фокус-сессий
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
