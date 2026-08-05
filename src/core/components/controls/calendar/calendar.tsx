import 'moment-timezone';

import React from 'react';
import moment from 'moment';

import { Day } from './day';
import { DayDisabled } from './day-disabled';
import { WeekDay } from './week-day';
import { Header } from './header';
import { Inputs } from './inputs';

import { getCalendarDays } from './utils/get-days.utils.ts';

import s from './default.module.scss';

const defaultMonths = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];
const defaultWeeks = ['П', 'В', 'С', 'Ч', 'П', 'Сб', 'Вс'];

interface IProps {
  autoFocus?: boolean;
  defaultValue?: string;
  value?: string;
  format?: string;
  timeSelection?: boolean;
  onChange: (value: string | undefined) => void;
  onCancel?(): void;
  displayTimeZone?: string;
}

const getMomentDate = (date: string | Date, timeZone?: string) => {
  if (timeZone) {
    return moment(date).tz(timeZone);
  }
  return moment(date);
};

export const Calendar: React.FC<IProps> = (props) => {
  const initializedRef = React.useRef(false);
  const activeDayRef = React.useRef<HTMLButtonElement | null>(null);
  const [changed, setChanged] = React.useState(false);
  const [shouldFocusActiveDay, setShouldFocusActiveDay] = React.useState(() => !!props.autoFocus);

  const [selectedDate, setSelectedDate] = React.useState<string>(() =>
    getMomentDate(props.value || props.defaultValue || new Date(), props.displayTimeZone).format(props.format),
  );

  const selectedMoment = getMomentDate(selectedDate, props.displayTimeZone);

  React.useEffect(() => {
    if (!changed) {
      return;
    }

    const nextValue = props.timeSelection
      ? selectedDate
      : getMomentDate(selectedDate, props.displayTimeZone).startOf('day').format(props.format);

    props.onChange(nextValue);
    setChanged(false);
  }, [changed, props.displayTimeZone, props.format, props.onChange, props.timeSelection, selectedDate]);

  React.useEffect(() => {
    if (initializedRef.current) {
      setSelectedDate(getMomentDate(props.value || new Date(), props.displayTimeZone).format(props.format));
      return;
    }

    initializedRef.current = true;
  }, [props.displayTimeZone, props.format, props.value]);

  const days = React.useMemo(() => {
    const calendarMoment = getMomentDate(selectedDate, props.displayTimeZone);

    return getCalendarDays(calendarMoment.year(), calendarMoment.month());
  }, [props.displayTimeZone, selectedDate]);

  const handlePrevMonth = (month: number) => {
    const newMonth = month - 1;
    const nextMoment = selectedMoment.clone();

    if (newMonth < 0) {
      setSelectedDate(nextMoment.subtract(1, 'year').month(11).format(props.format));
    } else {
      setSelectedDate(nextMoment.month(newMonth).format(props.format));
    }

    setShouldFocusActiveDay(true);
  };

  const handleNextMonth = (month: number) => {
    const newMonth = month + 1;
    const nextMoment = selectedMoment.clone();

    if (newMonth > 11) {
      setSelectedDate(nextMoment.add(1, 'year').month(0).format(props.format));
    } else {
      setSelectedDate(nextMoment.month(newMonth).format(props.format));
    }

    setShouldFocusActiveDay(true);
  };

  const handleChangeDate = (value: string) => {
    const currentMoment = getMomentDate(value, props.displayTimeZone);

    setSelectedDate(
      selectedMoment
        .clone()
        .year(currentMoment.year())
        .month(currentMoment.month())
        .date(currentMoment.date())
        .format(props.format),
    );
    setChanged(true);
  };

  const handleChange = (value: string) => {
    setSelectedDate(value);
    setChanged(true);
  };

  const handleMoveActiveDate = (amount: number, unit: moment.unitOfTime.DurationConstructor) => {
    setSelectedDate(selectedMoment.clone().add(amount, unit).format(props.format));
    setShouldFocusActiveDay(true);
  };

  const handleKeyDownDay = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      handleMoveActiveDate(-1, 'day');
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      handleMoveActiveDate(1, 'day');
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      handleMoveActiveDate(-7, 'day');
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      handleMoveActiveDate(7, 'day');
      return;
    }

    if (event.key === 'PageUp') {
      event.preventDefault();
      handleMoveActiveDate(-1, event.shiftKey ? 'year' : 'month');
      return;
    }

    if (event.key === 'PageDown') {
      event.preventDefault();
      handleMoveActiveDate(1, event.shiftKey ? 'year' : 'month');
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setChanged(true);
    }
  };

  React.useEffect(() => {
    if (!shouldFocusActiveDay) {
      return;
    }

    activeDayRef.current?.focus();
    setShouldFocusActiveDay(false);
  }, [selectedDate, shouldFocusActiveDay]);

  return (
    <div className={s.wrapper}>
      <div className={s.header}>
        <Header
          year={selectedMoment.year()}
          month={defaultMonths[selectedMoment.month()]}
          onPrevMonthClick={() => handlePrevMonth(selectedMoment.month())}
          onNextMonthClick={() => handleNextMonth(selectedMoment.month())}
        />
      </div>
      <div className={s.weeks}>
        {defaultWeeks.map((day, index) => {
          return (
            <WeekDay key={index} isWeekday={index === 5 || index === 6}>
              {day}
            </WeekDay>
          );
        })}
      </div>
      <div className={s.days}>
        {days.map((day, index) => {
          const currentMoment = getMomentDate(day.value, props.displayTimeZone);
          if (day.type === 'prev-month' || day.type === 'next-month') {
            return <DayDisabled key={index}>{currentMoment.format('DD')}</DayDisabled>;
          }

          const isActive = selectedMoment.isSame(currentMoment, 'day');

          return (
            <Day
              key={index}
              ref={isActive ? activeDayRef : undefined}
              tabIndex={isActive ? 0 : -1}
              isActive={isActive}
              isToday={day.isToday}
              isWeekday={day.isWeekday}
              onKeyDown={handleKeyDownDay}
              onClick={() => handleChangeDate(day.value)}
            >
              {currentMoment.format('DD')}
            </Day>
          );
        })}
      </div>
      {props.timeSelection ? (
        <div className={s.control}>
          <Inputs value={selectedDate} onChange={handleChange} onCancel={props.onCancel} />
        </div>
      ) : null}
    </div>
  );
};
