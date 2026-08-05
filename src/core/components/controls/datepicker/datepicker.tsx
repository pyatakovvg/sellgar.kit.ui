import 'moment-timezone';

import React from 'react';

import { CalendarLineIcon } from '../../../../icons';
import moment from 'moment';

import { Calendar } from '../calendar';
import { SelectInput } from '../../../systems/floating/internals/select-input';
import { Popover } from '../../overlay/popover';

import { Option } from './option';
import { Placeholder } from './placeholder';

import s from './default.module.scss';

export interface IProps {
  tailIcon?: React.ReactNode;
  badge?: string | number;
  size?: 'xs' | 'md';
  target?: 'destructive';
  value?: string;
  tabIndex?: number;
  placeholder?: string;
  disabled?: boolean;
  isClearable?: boolean;
  format?: string;
  displayFormat?: string;
  displayTimeZone?: string;
  timeSelection?: boolean;
  templateValue?(value: string): React.ReactNode;
  onChange?: (value?: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const Datepicker: React.FC<IProps> = (componentProps) => {
  const {
    value,
    placeholder,
    tabIndex = 0,
    tailIcon,
    badge,
    size,
    target,
    displayTimeZone,
    onBlur,
    onFocus,
    onChange,
    disabled,
    isClearable,
    format = 'YYYY-MM-DDTHH:mm:ss.sssZ',
    displayFormat = 'DD.MM.YYYY',
    timeSelection = true,
    templateValue,
  } = componentProps;

  const [open, setOpen] = React.useState(false);
  const [isKeyboardFocused, setKeyboardFocused] = React.useState(false);
  const dateValue = value;

  React.useEffect(() => {
    if (!disabled && initializeRef.current) {
      if (open) {
        onFocus?.();
      } else {
        onBlur?.();
      }
    }
  }, [open, disabled, onFocus, onBlur]);

  React.useEffect(() => {
    if (disabled && open) {
      setOpen(false);
    }
  }, [disabled, open]);

  const initializeRef = React.useRef(false);

  React.useEffect(() => {
    initializeRef.current = true;
    return () => {
      initializeRef.current = false;
    };
  }, []);

  const handleChange = (value: string | undefined) => {
    if (disabled) return;

    setOpen(false);
    onChange && onChange(value);
  };

  const handleTriggerFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    if (disabled) {
      return;
    }

    setKeyboardFocused(event.currentTarget.matches(':focus-visible'));
  };

  const handleTriggerBlur = () => {
    setKeyboardFocused(false);
  };

  const optionTitle =
    dateValue && displayTimeZone
      ? moment(dateValue).tz(displayTimeZone).format(displayFormat)
      : moment(dateValue).format(displayFormat);

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      disabled={disabled}
      placement={'bottom'}
      role={'listbox'}
      sizeToReference
    >
      <Popover.Trigger tabIndex={disabled ? -1 : tabIndex} onFocus={handleTriggerFocus} onBlur={handleTriggerBlur}>
        <SelectInput
          leadIcon={<CalendarLineIcon />}
          tailIcon={tailIcon}
          badge={badge}
          size={size}
          target={target}
          disabled={disabled}
          isFocused={open}
          isKeyboardFocused={isKeyboardFocused}
          isClearable={!!dateValue && isClearable}
          onClear={() => {
            if (disabled) {
              return void 0;
            }
            handleChange(undefined);
          }}
        >
          {dateValue ? (
            templateValue ? (
              templateValue(dateValue)
            ) : (
              <Option disabled={disabled} title={optionTitle} />
            )
          ) : (
            <Placeholder title={placeholder ?? 'Select...'} />
          )}
        </SelectInput>
      </Popover.Trigger>
      <Popover.Content>
        <div className={s.calendar}>
          <Calendar
            autoFocus
            value={dateValue}
            format={format}
            onChange={handleChange}
            onCancel={() => setOpen(false)}
            timeSelection={timeSelection}
            displayTimeZone={displayTimeZone}
          />
        </div>
      </Popover.Content>
    </Popover>
  );
};
