import moment from "moment";
import type { Moment } from "moment";

export function getCalender(cursor?: Moment) {
  const startOfMonth = cursor ? cursor.clone() : moment().startOf("month");

  const next = startOfMonth.clone().add(1, "month");
  const previous = startOfMonth.clone().subtract(1, "month").clone();

  const year = startOfMonth.year();
  const month = startOfMonth.month();
  const daysInMonth = startOfMonth.daysInMonth();

  const dates: Moment[] = new Array(daysInMonth);

  const weekdays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
  const calender = Object.fromEntries(
    weekdays.map((weekday) => [weekday, []]),
  ) as unknown as Record<(typeof weekdays)[number], Moment[]>;

  for (let index = 0; index < daysInMonth; index++) {
    const date = moment({ year, month, day: index + 1 });
    const weekday = weekdays[date.day()];

    dates[index] = date;
    calender[weekday].push(date);
  }

  return {
    weekdays,
    next,
    previous,
    dates,
    calender,
  };
}
