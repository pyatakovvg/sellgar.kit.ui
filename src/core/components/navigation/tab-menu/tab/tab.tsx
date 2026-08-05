import React from 'react';

import { Badge } from '../../../status/badge';
import { FillTab } from './fill';
import { LineTab } from './line';
import { SegmentedTab } from './segmented';
import { useTabMenuRootContext, useTabMenuVariantContext } from '../tab.context.ts';

export interface IProps {
  name: string;
  title: string;
  leadIcon?: React.ReactNode;
  tailIcon?: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
  onClick?(tabName: string): void;
}

const useBadgeSize = (size: ReturnType<typeof useTabMenuVariantContext>['size']) => {
  return React.useMemo<React.ComponentProps<typeof Badge>['size']>(() => {
    if (size === 'sm') {
      return 'sm';
    }

    return 'md';
  }, [size]);
};

const renderBadge = (
  badge: React.ReactNode,
  size: React.ComponentProps<typeof Badge>['size'],
  disabled: boolean | undefined,
): React.ReactNode => {
  return React.Children.map(badge, (child) => {
    if (React.isValidElement(child)) {
      const childElement = child as React.ReactElement<React.ComponentProps<typeof Badge>>;

      return React.cloneElement(childElement, {
        disabled,
        size,
      });
    }
    return child;
  });
};

export const Tab: React.FC<IProps> = (props) => {
  const { activeTabName, getPanelId, getTabId, setActiveTabName } = useTabMenuRootContext();
  const { shape, size, variant } = useTabMenuVariantContext();

  const isActive = activeTabName === props.name;
  const badgeSize = useBadgeSize(size);
  const badge = React.useMemo(
    () => renderBadge(props.badge, badgeSize, props.disabled),
    [badgeSize, props.badge, props.disabled],
  );

  const handleClick = () => {
    if (props.disabled) {
      return;
    }

    setActiveTabName(props.name);
    props.onClick?.(props.name);
  };

  const tabProps = {
    ...props,
    ariaControls: getPanelId(props.name),
    badge,
    id: getTabId(props.name),
    isActive,
    onClick: handleClick,
    shape,
    size,
  };

  if (variant === 'line') {
    return <LineTab {...tabProps} />;
  }

  if (variant === 'segmented') {
    return <SegmentedTab {...tabProps} />;
  }

  return <FillTab {...tabProps} />;
};
