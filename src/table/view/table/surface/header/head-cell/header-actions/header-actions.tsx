import React from 'react';

import { Popover } from '../../../../../../../core/components/overlay/popover';
import { More2FillIcon } from '../../../../../../../icons';
import { useTableEnvironment } from '../../../../context/table-context';
import { useHeadCellColumn } from '../context/head-cell-context';
import { Action } from './action';

import s from './default.module.scss';

export const HeaderActions: React.FC = () => {
  const environment = useTableEnvironment();
  const column = useHeadCellColumn();
  const [open, setOpen] = React.useState(false);
  const actions = environment.headerActions(column.id);

  return (
    <div className={s.wrapper} data-table-header-control="true">
      <Popover open={open} onOpenChange={setOpen} placement="bottom-end">
        <Popover.Trigger role="button" ariaLabel={`Действия с колонкой ${column.index + 1}`} tabIndex={0}>
          <span className={s.trigger}>
            <More2FillIcon />
          </span>
        </Popover.Trigger>
        <Popover.Content>
          <div className={s.content} role="group" aria-label="Действия с колонкой">
            {actions.map((action) => (
              <Action key={action.id} action={action} close={() => setOpen(false)} />
            ))}
          </div>
        </Popover.Content>
      </Popover>
    </div>
  );
};
