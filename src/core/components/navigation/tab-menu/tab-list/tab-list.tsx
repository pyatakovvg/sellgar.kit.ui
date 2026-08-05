import React from 'react';

import {
  TabMenuVariantProvider,
  type TTabMenuShape,
  type TTabMenuSize,
  type TTabMenuVariant,
  useTabMenuRootContext,
} from '../tab.context.ts';

interface IProps {
  children?: React.ReactNode;
  className: string;
  shape: TTabMenuShape;
  size: TTabMenuSize;
  variant: TTabMenuVariant;
}

const getEnabledTabs = (element: HTMLElement): HTMLButtonElement[] => {
  return Array.from(
    element.querySelectorAll<HTMLButtonElement>(
      'button[data-tab-menu-tab="true"]:not(:disabled)',
    ),
  );
};

export const TabList: React.FC<IProps> = (props) => {
  const { activeTabName, setActiveTabName } = useTabMenuRootContext();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const isHandledKey =
      event.key === 'ArrowLeft' ||
      event.key === 'ArrowRight' ||
      event.key === 'Home' ||
      event.key === 'End';

    if (!isHandledKey) {
      return;
    }

    const tabs = getEnabledTabs(event.currentTarget);

    if (tabs.length === 0) {
      return;
    }

    event.preventDefault();

    const currentIndex = tabs.findIndex(
      (tab) =>
        tab === document.activeElement ||
        tab.dataset.tabName === activeTabName,
    );

    let nextIndex = currentIndex < 0 ? 0 : currentIndex;

    if (event.key === 'ArrowLeft') {
      nextIndex = currentIndex <= 0 ? tabs.length - 1 : currentIndex - 1;
    }

    if (event.key === 'ArrowRight') {
      nextIndex = currentIndex >= tabs.length - 1 ? 0 : currentIndex + 1;
    }

    if (event.key === 'Home') {
      nextIndex = 0;
    }

    if (event.key === 'End') {
      nextIndex = tabs.length - 1;
    }

    const nextTab = tabs[nextIndex];
    const nextTabName = nextTab?.dataset.tabName;

    if (!nextTab || !nextTabName) {
      return;
    }

    setActiveTabName(nextTabName);
    nextTab.focus();
  };

  const variantContext = React.useMemo(
    () => ({
      shape: props.shape,
      size: props.size,
      variant: props.variant,
    }),
    [props.shape, props.size, props.variant],
  );

  return (
    <TabMenuVariantProvider value={variantContext}>
      <div
        className={props.className}
        role={'tablist'}
        onKeyDown={handleKeyDown}
      >
        {props.children}
      </div>
    </TabMenuVariantProvider>
  );
};
