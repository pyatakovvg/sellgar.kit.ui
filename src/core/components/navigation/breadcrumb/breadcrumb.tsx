import cn from 'classnames';
import React from 'react';

import { BreadcrumbItem } from './item';

import s from './default.module.scss';

type TBreadcrumbItem = {
  label: React.ReactNode;
  href?: string;
  leadIcon?: React.ReactNode;
  tailIcon?: React.ReactNode;
  variant?: 'default' | 'more';
};

interface IProps {
  size?: 'sm' | 'md';
  divider?: 'arrow' | 'slash';
  wrap?: boolean;
  items: readonly TBreadcrumbItem[];
}

const EMPTY_ITEMS: readonly TBreadcrumbItem[] = [];

const isMoreItem = (item: TBreadcrumbItem): item is Extract<TBreadcrumbItem, { variant: 'more' }> => {
  return item.variant === 'more';
};

export const Breadcrumb: React.FC<IProps> = ({ divider = 'arrow', items = EMPTY_ITEMS, size = 'sm', wrap = false }) => {
  const wrapperClassName = cn(s.breadcrumb, { [s.wrap]: wrap });

  return (
    <div className={wrapperClassName}>
      {items.map((item, index) => {
        const isMore = isMoreItem(item);
        const isCurrent = !isMore && index === items.length - 1;

        return (
          <BreadcrumbItem
            key={index}
            wrap={wrap}
            divider={divider}
            hasDivider={index < items.length - 1}
            href={isCurrent ? void 0 : item.href}
            isCurrent={isCurrent}
            label={item.label}
            leadIcon={item.leadIcon}
            size={size}
            tailIcon={item.tailIcon}
            variant={isMore ? 'more' : 'default'}
          />
        );
      })}
    </div>
  );
};
