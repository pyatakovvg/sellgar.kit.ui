import React from 'react';
import cn from 'classnames';

import { Scrollbar } from '../../../../core/components/layout/scrollbar';

import { useTableEnvironment, useTableSnapshot } from '../context/table-context';
import { numbers } from '../serializer/numbers';
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
      data-total-width={state.total}
      data-container-width={state.viewport.container}
      data-dragging={state.dragging}
    >
      <div ref={probe} className={s.probe} aria-hidden="true" />
      <ScrollContainer
        ref={scrollHost}
        className={scrollerClassName}
        data-table-scroll={!environment.parentBrowser || undefined}
      >
        <div
          ref={surface}
          className={s.surface}
          style={{ width: numbers(Math.max(state.total, state.viewport.container)) }}
        >
          {state.error ? (
            <p role="alert">{state.error}</p>
          ) : (
            <>
              <div className={s.space} style={{ height: numbers(state.headerHeight) }} aria-hidden="true" />
              <Body />
            </>
          )}
        </div>
      </ScrollContainer>
      <Header />
    </div>
  );
};
