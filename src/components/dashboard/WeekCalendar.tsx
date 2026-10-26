interface WeekCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const weekDays = ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"];

export default function WeekCalendar({
  selectedDate,
  onSelectDate,
}: WeekCalendarProps) {
  const today = new Date();

  const monday = new Date(selectedDate);

  const currentDay = monday.getDay();

  monday.setDate(
    monday.getDate() - ((currentDay + 6) % 7)
  );

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);

    return date;
  });

  return (
    <section className="grid grid-cols-7 gap-1 rounded-[22px] border border-gray-200 bg-white p-2 shadow-sm dark:border-[#333640] dark:bg-[#202127]">

      {days.map((date, index) => {
        const selected =
          date.toDateString() === selectedDate.toDateString();

        const isToday =
          date.toDateString() === today.toDateString();

        return (
          <button
            key={date.toDateString()}
            type="button"
            onClick={() => onSelectDate(date)}
            className={`flex h-[56px] flex-col items-center justify-center gap-1 rounded-2xl transition ${
              selected
                ? "bg-[#17181e] text-white shadow-md"
                : "hover:bg-gray-100 dark:hover:bg-[#292b33]"
            }`}
          >
            <span
              className={`text-[10px] ${
                selected ? "text-gray-400" : "text-gray-400"
              }`}
            >
              {weekDays[index]}
            </span>

            <span className="text-sm font-semibold">
              {date.getDate()}

              {isToday && (
                <span className="ml-1 text-[#ff503b]">•</span>
              )}
            </span>
          </button>
        );
      })}

    </section>
  );
}