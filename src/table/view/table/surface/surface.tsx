import React from 'react';
import cn from 'classnames';

import { Scrollbar } from '../../../../core/components/layout/scrollbar';

import { useTableEnvironment, useTableSnapshot } from '../context/table-context';
import { Body } from './body';
import { Header } from './header';

import s from './default.module.scss';

interface SurfaceStyle extends React.CSSProperties {
  '--table-sticky-top': string;
}

export const Surface: React.FC = () => {
  const environment = useTableEnvironment();
  const state = useTableSnapshot();
  const root = React.useRef<HTMLDivElement>(null);
  const surface = React.useRef<HTMLDivElement>(null);
  const scrollHost = React.useRef<HTMLDivElement>(null);
  const probe = React.useRef<HTMLDivElement>(null);
  const [portal, setPortal] = React.useState<HTMLDivElement | null>(null);
  const wrapperClassName = cn(
    s.wrapper,
    { [s.standalone]: environment.surface === 'standalone' },
    environment.className,
  );
  const scrollerClassName = cn(s.scroller, {
    [s.internal]: !environment.parentBrowser && environment.scroll === 'internal',
  });
  const ScrollContainer = environment.parentBrowser ? 'div' : Scrollbar;
  const style: SurfaceStyle = { '--table-sticky-top': environment.stickyTop };

  React.useLayoutEffect(() => {
    if (!root.current || !surface.current || !probe.current || !scrollHost.current) return;
    return environment.browser.attach(
      root.current,
      surface.current,
      probe.current,
      scrollHost.current,
      !environment.parentBrowser && environment.scroll === 'internal',
      environment.parentBrowser,
    );
  }, [environment.browser, environment.parentBrowser, environment.scroll, environment.stickyTop]);

  React.useLayoutEffect(() => {
    if (!root.current || !environment.parentBrowser) return;
    return environment.parentBrowser.observeNested(environment.headerId, root.current, environment.runtime);
  }, [environment.parentBrowser, environment.headerId, environment.runtime]);

  React.useLayoutEffect(() => environment.browser.present());

  return (
    <div
      ref={root}
      className={wrapperClassName}
      style={style}
      role="table"
      aria-rowcount={state.rowCount + 1}
      aria-colcount={state.columnCount}
      aria-owns={state.error ? undefined : `${environment.headerId} ${environment.headerId}-body`}
      data-table="geometry"
      data-row-count={state.rowCount}
      data-column-count={state.columnCount}
      data-visible-cells={state.rows.length * state.columns.length}
    >
      <div ref={probe} className={s.probe} aria-hidden="true" />
      <ScrollContainer
        ref={scrollHost}
        className={scrollerClassName}
        data-table-scroll={!environment.parentBrowser || undefined}
      >
        <div ref={surface} className={s.surface}>
          {state.error && <p role="alert">{state.error}</p>}
          <div className={state.error ? s.failed : undefined} inert={Boolean(state.error)}>
            <Header portal={portal} />
            <Body />
          </div>
        </div>
      </ScrollContainer>
      <div ref={setPortal} data-table-header-portal="true" />
    </div>
  );
};
