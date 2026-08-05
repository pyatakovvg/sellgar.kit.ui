export interface IDay {
  type: 'prev-month' | 'next-month' | 'current-month' | 'day-week';
  isToday: boolean;
  isWeekday: boolean;
  value: string;
}

export const factoryDay = (day: IDay): IDay => {
  return {
    type: day.type,
    isToday: day.isToday,
    isWeekday: day.isWeekday,
    value: day.value,
  };
};
