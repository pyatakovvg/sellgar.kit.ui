import React from 'react';

import type { TableBrowser } from '../../../../../runtime/browser/table-browser';

export const useHeaderMount = (browser: TableBrowser, portal: HTMLElement | null, active: boolean) => {
  const slot = React.useRef<HTMLDivElement>(null);
  const [mount, setMount] = React.useState<HTMLDivElement | null>(null);

  React.useLayoutEffect(() => {
    const element = document.createElement('div');
    element.dataset.tableHeaderMount = 'true';
    setMount(element);
    return () => element.remove();
  }, []);

  React.useLayoutEffect(() => {
    if (active && mount && slot.current && portal) return browser.attachHeaderPlacement(mount, slot.current, portal);
  }, [browser, mount, portal, active]);

  return { slot, mount };
};
