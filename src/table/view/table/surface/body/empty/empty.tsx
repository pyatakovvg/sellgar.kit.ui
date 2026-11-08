import React from 'react';

import { useTableEnvironment } from '../../../context/table-context';

import s from './default.module.scss';

export const Empty: React.FC = () => {
  const environment = useTableEnvironment();
  const root = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(
    () => (root.current ? environment.browser.observeEmpty(root.current) : undefined),
    [environment.browser],
  );

  return (
    <div ref={root} className={s.wrapper}>
      {environment.renderEmpty()}
    </div>
  );
};
