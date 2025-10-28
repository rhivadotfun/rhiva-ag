import moment from "moment";
import type { Moment } from "moment";

type DailyPnL = {
  date: string;
  pnl: number;
};

export function getCalender(cursor?: Moment) {
  const startOfMonth = cursor ? cursor.clone() : moment().startOf("month");

  const next = startOfMonth.clone().add(1, "month");
  const previous = startOfMonth.clone().subtract(1, "month").clone();

  const year = startOfMonth.year();
  const month = startOfMonth.month();
  const daysInMonth = startOfMonth.daysInMonth();
  const weekdays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

  const dates: Moment[] = new Array(daysInMonth);
  const firstDayOfWeek = startOfMonth.day();

  const totalCells = firstDayOfWeek + daysInMonth;
  const totalWeeks = Math.ceil(totalCells / 7);

  const calendarGrid: (Moment | null)[][] = [];

  for (let week = 0; week < totalWeeks; week++) {
    const weekRow: (Moment | null)[] = new Array(7).fill(null);

    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const cellIndex = week * 7 + dayOfWeek;
      const dayOfMonth = cellIndex - firstDayOfWeek + 1;

      if (dayOfMonth >= 1 && dayOfMonth <= daysInMonth) {
        const date = moment({ year, month, day: dayOfMonth });
        weekRow[dayOfWeek] = date;
        dates[dayOfMonth - 1] = date;
      }
    }

    calendarGrid.push(weekRow);
  }

  return {
    weekdays,
    next,
    previous,
    dates,
    calendarGrid,
    firstDayOfWeek,
  };
}

export type { DailyPnL };
