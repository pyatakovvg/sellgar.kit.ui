import moment from 'moment';

import { factoryDay, type IDay } from './factory-day.utils.ts';

export const getCalendarDays = (year: number, month: number): IDay[] => {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 - воскресенье, 1 - понедельник, ..., 6 - суббота
  const daysInCurrentMonth = lastDayOfMonth.getDate();

  const calendarDays: IDay[] = [];

  const daysInPreviousMonth = new Date(year, month, 0).getDate();
  const daysToAddFromPreviousMonth = (firstDayOfWeek + 6) % 7;

  for (let i = daysToAddFromPreviousMonth; i > 0; i--) {
    const date = moment()
      .year(year)
      .month(month - 1)
      .date(daysInPreviousMonth - i + 1)
      .hour(0)
      .minute(0)
      .second(0)
      .millisecond(0);
    const isWeekday = date.day() === 0 || date.day() === 6;
    const day = factoryDay({
      type: 'prev-month' as const,
      isToday: false,
      isWeekday,
      value: date.format(),
    });
    calendarDays.push(day);
  }

  const today = moment();
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const date = moment().year(year).month(month).date(day).hour(0).minute(0).second(0).millisecond(0);
    const isToday = today.year() === year && today.month() === month && today.date() === day;
    const isWeekday = date.day() === 0 || date.day() === 6;
    const dayEntry = factoryDay({
      type: 'current-month' as const,
      isToday: isToday,
      isWeekday,
      value: date.format(),
    });
    calendarDays.push(dayEntry);
  }

  const totalDaysInRow = 7;
  const totalDisplayedDays = calendarDays.length;
  const daysToAddFromNextMonth = (totalDaysInRow - (totalDisplayedDays % totalDaysInRow)) % totalDaysInRow;

  for (let day = 1; day <= daysToAddFromNextMonth; day++) {
    const date = moment()
      .year(year)
      .month(month + 1)
      .date(day)
      .hour(0)
      .minute(0)
      .second(0)
      .millisecond(0);
    const isWeekday = date.day() === 0 || date.day() === 6;
    const dayEntry = factoryDay({
      type: 'next-month' as const,
      isToday: false,
      isWeekday,
      value: date.format(),
    });
    calendarDays.push(dayEntry);
  }

  return calendarDays;
};
