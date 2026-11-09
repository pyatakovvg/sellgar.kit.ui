import React from 'react';
import { createPortal } from 'react-dom';

import { useTableEnvironment, useTableSnapshot } from '../../context/table-context';
import { HeadCell } from './head-cell';
import { useHeaderMount } from './hooks/use-header-mount.hook';

import s from './default.module.scss';

interface IProps {
  portal: HTMLElement | null;
}

export const Header: React.FC<IProps> = (props) => {
  const environment = useTableEnvironment();
  const state = useTableSnapshot();
  const root = React.useRef<HTMLDivElement>(null);
  const { slot, mount } = useHeaderMount(environment.browser, props.portal);

  React.useLayoutEffect(
    () => (root.current ? environment.browser.attachHeader(root.current) : undefined),
    [environment.browser, mount],
  );

  React.useLayoutEffect(() => environment.browser.present());

  return (
    <div ref={slot} data-table-header-slot="true">
      {mount &&
        createPortal(
          <div id={environment.headerId} className={s.wrapper} role="rowgroup" data-table-header-layer="true">
            <div ref={root} className={s.header} role="row" aria-rowindex={1} data-table-header="true">
              {state.columns.map((column) => (
                <HeadCell column={column} key={column.id} />
              ))}
            </div>
          </div>,
          mount,
        )}
    </div>
  );
};
