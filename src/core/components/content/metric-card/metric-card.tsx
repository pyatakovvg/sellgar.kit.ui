import React from 'react';
import cn from 'classnames';

import { ArrowRightDownLineIcon, ArrowRightUpLineIcon } from '../../../../icons';

import css from './metric-card.module.css';
import { Typography } from '../typography';

type TSize = 'sm' | 'md' | 'lg';
type TDynamics = 'default' | 'positive' | 'negative';

type Props = {
  size?: TSize;
};

interface IContext {
  size: TSize;
}

const currencyFormat = (amount: number | bigint | Intl.StringNumericLiteral, options?: Intl.NumberFormatOptions) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: options?.currency,
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
};

const percentageFormat = (amount: number | bigint | Intl.StringNumericLiteral) => {
  const numeric = Number(amount) / 100;
  return new Intl.NumberFormat('ru-RU', {
    style: 'percent',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(numeric);
};

const numberFormat = (amount: number | bigint | Intl.StringNumericLiteral) => {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
};

export const MetricCardContext = React.createContext<IContext>({ size: 'md' });

const MetricCardComponent: React.FC<React.PropsWithChildren<Props>> = ({ size = 'md', children }) => {
  return (
    <MetricCardContext.Provider value={{ size }}>
      <div
        className={cn(css.wrapper, size === 'sm' ? css.small : size === 'md' ? css.middle : css.large)}
        data-qa={'metric-card.container'}
      >
        {children}
      </div>
    </MetricCardContext.Provider>
  );
};

type ValueProps = {
  amount: number | bigint | Intl.StringNumericLiteral;
  currency?: string;
  type?: 'default' | 'percentage' | 'currency';
};

const Value: React.FC<ValueProps> = ({ amount, type, currency }) => {
  const { size } = React.useContext(MetricCardContext);
  const result =
    type === 'currency'
      ? currencyFormat(amount, { currency })
      : type === 'percentage'
        ? percentageFormat(amount)
        : numberFormat(amount);
  return (
    <Typography size={size === 'sm' ? 'body-s' : size === 'md' ? 'body-l' : 'h5'} weight={'bold'}>
      <div data-qa={'metric-card.value'}>{result}</div>
    </Typography>
  );
};

type DynamicsProps = {
  type: TDynamics;
};

const Dynamics: React.FC<DynamicsProps> = ({ type }) => {
  const icon = type === 'positive' ? <ArrowRightUpLineIcon /> : type === 'negative' ? <ArrowRightDownLineIcon /> : null;
  const className = type === 'positive' ? css.positive : type === 'negative' ? css.negative : undefined;

  return icon ? (
    <div className={cn(css.icon, className)} data-qa={'metric-card.dynamics'}>
      {icon}
    </div>
  ) : null;
};

type TLabelProps = {
  dynamics: TDynamics;
};

const Label: React.FC<React.PropsWithChildren<TLabelProps>> = ({ children, dynamics = 'default' }) => {
  const { size } = React.useContext(MetricCardContext);

  return (
    <div className={css.label}>
      <Typography size={size === 'sm' ? 'caption-s' : 'caption-l'}>
        <div className={css.labelText} data-qa={'metric-card.label'}>
          {children}
        </div>
      </Typography>
      <Dynamics type={dynamics} />
    </div>
  );
};

type TMetricCard = typeof MetricCardComponent & {
  Value: typeof Value;
  Label: typeof Label;
};

export const MetricCard: TMetricCard = Object.assign(MetricCardComponent, {
  Value: Value,
  Label: Label,
});
