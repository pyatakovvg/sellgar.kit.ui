import React from 'react';
import cn from 'classnames';

import css from './option-card.module.css';
import { Typography } from '../typography';

type Props = {
  title: React.ReactNode;
  description?: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: (event: React.MouseEvent) => void;
  tabIndex?: number;
};

const OptionCardComponent: React.FC<Props> = ({ active, description, onClick, disabled, title, tabIndex }) => {
  const handleClick = (event: React.MouseEvent) => {
    if (!disabled && onClick) onClick(event);
  };

  return (
    <div
      className={cn(css.wrapper, active && css.selected, disabled && css.disabled)}
      onClick={handleClick}
      tabIndex={tabIndex || 0}
    >
      <Typography size={'body-s'} weight={'bold'}>
        <div className={css.title}>{title}</div>
      </Typography>
      <Typography size={'caption-s'}>
        <div className={css.description}>{description}</div>
      </Typography>
    </div>
  );
};

type SelectorProps = {
  value?: string;
  onChange: (value: string) => void;
};

interface IContext {
  value?: string;
  onChange?: (value: string) => void;
}

const SelectorContext = React.createContext<IContext>({});

const Selector: React.FC<React.PropsWithChildren<SelectorProps>> = ({ value, onChange, children }) => {
  return (
    <SelectorContext.Provider value={{ value, onChange }}>
      <div className={css.selector}>{children}</div>
    </SelectorContext.Provider>
  );
};

type OptionProps = {
  value: string;
} & Props;

const Option: React.FC<OptionProps> = ({ value, onClick, ...props }) => {
  const { onChange, value: controlValue } = React.useContext(SelectorContext);

  const handleClick = React.useCallback(
    (event: React.MouseEvent) => {
      if (onClick) onClick(event);
      if (onChange) onChange(value);
    },
    [onClick],
  );

  return <OptionCardComponent {...props} onClick={handleClick} active={value === controlValue} />;
};

type TOptionCard = typeof OptionCardComponent & {
  Selector: typeof Selector;
  Option: typeof Option;
};

export const OptionCard: TOptionCard = Object.assign(OptionCardComponent, {
  Selector,
  Option,
});
