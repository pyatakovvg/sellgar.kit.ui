import React from 'react';

import { Fill } from './fill';
import { Line } from './line';
import { Segmented } from './segmented';
import { Tab } from './tab';
import {
  TabMenuRootProvider,
  useTabMenuRootContext,
} from './tab.context.ts';

const createDomIdPart = (value: string): string => {
  return encodeURIComponent(value).replaceAll('%', '');
};

interface IContentProps {
  name: string;
}

const TabPanel: React.FC<React.PropsWithChildren<IContentProps>> = (props) => {
  const { activeTabName, getPanelId, getTabId } = useTabMenuRootContext();

  if (activeTabName !== props.name) {
    return null;
  }

  return (
    <div
      aria-labelledby={getTabId(props.name)}
      id={getPanelId(props.name)}
      role={'tabpanel'}
    >
      {props.children}
    </div>
  );
};

interface IProps {
  children?: React.ReactNode;
  defaultTabName?: string;
}

const TabMenuComponent: React.FC<IProps> = (props) => {
  const [activeTabName, setActiveTabName] = React.useState(props.defaultTabName);
  const reactId = React.useId();

  const rootId = React.useMemo(
    () => `tab-menu-${createDomIdPart(reactId)}`,
    [reactId],
  );

  const getTabId = React.useCallback(
    (tabName: string) => `${rootId}-tab-${createDomIdPart(tabName)}`,
    [rootId],
  );

  const getPanelId = React.useCallback(
    (tabName: string) => `${rootId}-panel-${createDomIdPart(tabName)}`,
    [rootId],
  );

  const contextValue = React.useMemo(
    () => ({
      activeTabName,
      getPanelId,
      getTabId,
      setActiveTabName,
    }),
    [activeTabName, getPanelId, getTabId],
  );

  return (
    <TabMenuRootProvider value={contextValue}>
      {props.children}
    </TabMenuRootProvider>
  );
};

type TTabMenu = typeof TabMenuComponent & {
  Content: typeof TabPanel;
  Fill: typeof Fill;
  Line: typeof Line;
  Segmented: typeof Segmented;
  Tab: typeof Tab;
};

export const TabMenu: TTabMenu = Object.assign(TabMenuComponent, {
  Content: TabPanel,
  Fill,
  Line,
  Segmented,
  Tab,
});
