import React from 'react';

import { ProgressBar } from '../../../../../core/components/feedback/progress-bar';
import { useTableEnvironment } from '../../context/table-context';
import { useLoadingProgress } from './hooks/use-loading-progress.hook';

import s from './default.module.scss';

export const Loading: React.FC = () => {
  const environment = useTableEnvironment();
  const progress = useLoadingProgress(environment.loading === true);

  return (
    <div className={s.wrapper} data-table-loading-layer="true" aria-hidden={!progress.visible}>
      <div className={s.track} data-table-loading-track="true" data-visible={progress.visible}>
        <ProgressBar
          key={progress.cycle}
          size="sm"
          value={progress.value}
          max={100}
          aria-label="Загрузка данных"
          aria-valuetext={environment.loading ? 'Загрузка…' : 'Загрузка завершена'}
        />
      </div>
    </div>
  );
};
