import React from 'react';

import { ArrowRightSLineIcon } from '../../../../../icons';

import { Typography } from '../../../content/typography';

import cn from 'classnames';
import s from './default.module.scss';

interface IProps {
  divider: 'arrow' | 'slash';
  hasDivider: boolean;
  href?: string;
  isCurrent: boolean;
  label: React.ReactNode;
  leadIcon?: React.ReactNode;
  size: 'sm' | 'md';
  tailIcon?: React.ReactNode;
  variant: 'default' | 'more';
}

export const BreadcrumbItem: React.FC<IProps> = ({
  divider,
  hasDivider,
  href,
  isCurrent,
  label,
  leadIcon,
  size,
  tailIcon,
  variant,
}) => {
  const isMore = variant === 'more';
  const isLink = href !== void 0 && !isCurrent;
  const wrapperClassName = React.useMemo(
    () =>
      cn(s.wrapper, {
        [s['variant--default']]: !isMore,
        [s['variant--more']]: isMore,
        [s.current]: isCurrent,
      }),
    [isCurrent, isMore],
  );

  const contentClassName = React.useMemo(
    () =>
      cn(
        s.content,
        {
          [s['size--sm']]: size === 'sm',
          [s['size--md']]: size === 'md',
        },
        {
          [s.link]: isLink,
          [s.current]: isCurrent,
        },
      ),
    [isCurrent, isLink, size],
  );

  const iconClassName = React.useMemo(
    () =>
      cn(
        s.icon,
        {
          [s['size--sm']]: size === 'sm',
          [s['size--md']]: size === 'md',
        },
        {
          [s.current]: isCurrent,
        },
      ),
    [isCurrent, size],
  );

  const labelClassName = React.useMemo(
    () =>
      cn(
        s.label,
        {
          [s['size--sm']]: size === 'sm',
          [s['size--md']]: size === 'md',
        },
        {
          [s.current]: isCurrent,
        },
      ),
    [isCurrent, size],
  );

  const dividerClassName = React.useMemo(
    () =>
      cn(
        s.divider,
        {
          [s['size--sm']]: size === 'sm',
          [s['size--md']]: size === 'md',
        },
        {
          [s['divider--slash']]: divider === 'slash',
        },
      ),
    [divider, size],
  );

  const typographySize = size === 'sm' ? 'caption-m' : 'caption-l';
  const innerNode = (
    <>
      {!isMore && leadIcon && <div className={iconClassName}>{leadIcon}</div>}
      <Typography size={typographySize} weight={'medium'}>
        <span className={labelClassName}>{label}</span>
      </Typography>
      {!isMore && tailIcon && <div className={iconClassName}>{tailIcon}</div>}
    </>
  );

  return (
    <div className={wrapperClassName}>
      {isLink && (
        <a className={contentClassName} href={href}>
          {innerNode}
        </a>
      )}

      {!isLink && (
        <span className={contentClassName} aria-current={isCurrent ? 'page' : void 0}>
          {innerNode}
        </span>
      )}

      {hasDivider && (
        <div className={dividerClassName}>
          {divider === 'arrow' && <ArrowRightSLineIcon />}
          {divider === 'slash' && <span>/</span>}
        </div>
      )}
    </div>
  );
};
