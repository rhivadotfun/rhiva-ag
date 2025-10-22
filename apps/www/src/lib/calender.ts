import moment from "moment";
import type { Moment } from "moment";

type DailyPnL = {
  date: string; // YYYY-MM-DD format
  pnl: number; // positive for profit, negative for loss
};

export function getCalender(cursor?: Moment, dailyPnLData?: DailyPnL[]) {
  const startOfMonth = cursor ? cursor.clone() : moment().startOf("month");

  const next = startOfMonth.clone().add(1, "month");
  const previous = startOfMonth.clone().subtract(1, "month").clone();

  const year = startOfMonth.year();
  const month = startOfMonth.month();
  const daysInMonth = startOfMonth.daysInMonth();

  const dates: Moment[] = new Array(daysInMonth);

  const weekdays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

  // Create a map of date strings to P&L values for quick lookup
  const pnlMap = new Map<string, number>();
  if (dailyPnLData) {
    dailyPnLData.forEach(({ date, pnl }) => {
      pnlMap.set(date, pnl);
    });
  }

  // Get the day of week for the 1st of the month (0 = Sunday, 6 = Saturday)
  const firstDayOfWeek = startOfMonth.day();

  // Calculate total cells needed (offset + days in month)
  const totalCells = firstDayOfWeek + daysInMonth;
  const totalWeeks = Math.ceil(totalCells / 7);

  // Create a grid structure: array of weeks, each week has 7 days
  const calendarGrid: ({ moment: Moment; pnl?: number } | null)[][] = [];
  let monthlyTotal = 0;

  for (let week = 0; week < totalWeeks; week++) {
    const weekRow: ({ moment: Moment; pnl?: number } | null)[] = new Array(
      7,
    ).fill(null);

    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const cellIndex = week * 7 + dayOfWeek;
      const dayOfMonth = cellIndex - firstDayOfWeek + 1;

      if (dayOfMonth >= 1 && dayOfMonth <= daysInMonth) {
        const date = moment({ year, month, day: dayOfMonth });
        const dateString = date.format("YYYY-MM-DD");
        const pnl = pnlMap.get(dateString);

        if (pnl !== undefined) {
          monthlyTotal += pnl;
        }

        weekRow[dayOfWeek] = { moment: date, pnl };
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
    monthlyTotal,
  };
}

export type { DailyPnL };
