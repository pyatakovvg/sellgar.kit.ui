import React from 'react';
import moment from 'moment';

import { Field } from '../../field';
import { InputMask } from '../../input-mask';
import { Label } from '../../../status';
import { Controls } from './controls';

import s from './default.module.scss';

interface IProps {
  value: string;
  isDateDisabled?(date: Date): boolean;
  onChange(value: string): void;
  onCancel?(): void;
}

const parseDate = (value: string) => {
  const match = value.match(/(0[1-9]|[1-2][0-9]|3[0-1])\.(0[1-9]|1[0-2])\.(\d{4})/);

  if (!match) {
    return null;
  }

  return moment()
    .year(Number(match[3]))
    .month(Number(match[2]) - 1)
    .date(Number(match[1]))
    .startOf('day');
};

export const Inputs: React.FC<IProps> = (props) => {
  const [date, setDate] = React.useState(() => moment(props.value).format('DD.MM.YYYY'));
  const [time, setTime] = React.useState(() => moment(props.value).format('HH:mm'));

  const [errorDateValidate, setErrorDateValidate] = React.useState(false);
  const [errorTimeValidate, setErrorTimeValidate] = React.useState(false);

  React.useEffect(() => {
    setDate(moment(props.value).format('DD.MM.YYYY'));
    setTime(moment(props.value).format('HH:mm'));
  }, [props.value]);

  const handleChangeDate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value;
    const parsedDate = parseDate(date);

    setErrorDateValidate(!parsedDate || Boolean(props.isDateDisabled?.(parsedDate.toDate())));
    setDate(date);
  };

  const handleChangeTime = (event: React.ChangeEvent<HTMLInputElement>) => {
    const time = event.target.value;
    const matchTime = time.match(/([0-1][0-9]|2[0-3]):([0-5][0-9])/);

    setErrorTimeValidate(!matchTime);
    setTime(time);
  };

  const handleChange = () => {
    const parsedDate = parseDate(date);
    const matchTime = time.match(/([0-1][0-9]|2[0-3]):([0-5][0-9])/);

    if (!parsedDate || !matchTime) {
      return void 0;
    }

    if (props.isDateDisabled?.(parsedDate.toDate())) {
      setErrorDateValidate(true);
      return void 0;
    }

    const result = parsedDate.hour(Number(matchTime[1])).minute(Number(matchTime[2])).second(0).millisecond(0).format();

    props.onChange(result);
  };

  const handleCancel = () => {
    setDate(moment(props.value).format('DD.MM.YYYY'));
    setTime(moment(props.value).format('HH:mm'));
    setErrorDateValidate(false);
    setErrorTimeValidate(false);
    props.onCancel?.();
  };

  return (
    <div className={s.wrapper}>
      <div className={s.fields}>
        <div className={s.field}>
          <Field>
            <Field.Label>
              <Label label={'Дата'} />
            </Field.Label>
            <Field.Content>
              <InputMask
                size={'xs'}
                mask={'__.__.____'}
                replacement={{ _: /\d/ }}
                value={date}
                target={errorDateValidate ? 'destructive' : undefined}
                onChange={handleChangeDate}
              />
            </Field.Content>
          </Field>
        </div>
        <div className={s.field}>
          <Field>
            <Field.Label>
              <Label label={'Время'} />
            </Field.Label>
            <Field.Content>
              <InputMask
                size={'xs'}
                mask={'__:__'}
                replacement={{ _: /\d/ }}
                value={time}
                target={errorTimeValidate ? 'destructive' : undefined}
                onChange={handleChangeTime}
              />
            </Field.Content>
          </Field>
        </div>
      </div>
      <div className={s.control}>
        <Controls onApply={handleChange} onCancel={handleCancel} />
      </div>
    </div>
  );
};
